import type Arweave from "../../arweave";
import { MAX_CHUNK_SIZE, validatePath } from "../merkle";
import type Transaction from "../transaction";
import { b64UrlToBuffer, bufferTob64Url } from "../utils";
import AsyncRetry from "async-retry";
import { pipeline } from "stream/promises";
import { chunker } from "./chunker";
// import type { DebugOptions } from "./common/types";
type DebugOptions = {
  log: (message: string) => void;
  debug: boolean;
};

// Copied from `arweave-js`.
const FATAL_CHUNK_UPLOAD_ERRORS = [
  "invalid_json",
  "chunk_too_big",
  "data_path_too_big",
  "offset_too_big",
  "data_size_too_big",
  "chunk_proof_ratio_not_attractive",
  "invalid_proof",
];

type ChunkUploadPayload = {
  data_root: string;
  data_size: string;
  data_path: string;
  offset: string;
  chunk: string;
};

const MAX_CONCURRENT_CHUNK_UPLOAD_COUNT = 128;

/**
 * Uploads the piped data to the specified transaction.
 *
 * @param tx
 * @param arweave
 * @param createTx whether or not the passed transaction should be created on the network.
 * This can be false if we want to reseed an existing transaction,
 * @param debugOpts
 */
export function uploadTransactionAsync(
  tx: Transaction,
  arweave: Arweave,
  createTx = true,
  debugOpts?: DebugOptions,
): (source: AsyncIterable<Buffer>) => Promise<void> {
  const txId = tx.id;

  const log = (message: string): void => {
    if (debugOpts?.log) debugOpts.log(`[uploadTransactionAsync:${txId}] ${message}`);
  };

  log(`Starting chunked upload - ${tx.chunks?.chunks?.length} chunks / ${tx.data_size} total bytes`);

  return async (source: AsyncIterable<Buffer>): Promise<void> => {
    if (!tx.chunks) {
      throw Error("Transaction has no computed chunks!");
    }

    if (createTx) {
      // Ensure the transaction data field is blank.
      // We'll upload this data in chunks instead.
      tx.data = new Uint8Array(0);

      const createTxRes = await AsyncRetry(() => arweave.api.post(`tx`, tx), { retries: 10 });
      if (!(createTxRes.status >= 200 && createTxRes.status < 300)) {
        throw new Error(`Failed to create transaction: status ${createTxRes.status} / data ${createTxRes.data}`);
      }
    }

    const txChunkData = tx.chunks;
    const { chunks, proofs } = txChunkData;

    function prepareChunkUploadPayload(chunkIndex: number, chunkData: Buffer): ChunkUploadPayload {
      const proof = proofs[chunkIndex];
      return {
        data_root: tx.data_root,
        data_size: tx.data_size,
        data_path: bufferTob64Url(proof.proof),
        offset: proof.offset.toString(),
        chunk: bufferTob64Url(chunkData),
      };
    }

    log(`Starting pipe - MAX_CHUNK_SIZE=${MAX_CHUNK_SIZE}`);

    await pipeline(source, chunker(MAX_CHUNK_SIZE, { flush: true }), async (chunkedSource: AsyncIterable<Buffer>) => {
      let chunkIndex = 0;
      let dataRebalancedIntoFinalChunk: Buffer | undefined;

      const activeChunkUploads: Promise<any>[] = [];

      for await (const chunkData of chunkedSource) {
        const currentChunk = chunks[chunkIndex];
        const chunkSize = currentChunk.maxByteRange - currentChunk.minByteRange;

        log(`Got chunk - ${chunkData.byteLength} bytes / chunkSize ${chunkSize}`);

        const expectedToBeFinalRebalancedChunk = dataRebalancedIntoFinalChunk != null;

        let chunkPayload: ChunkUploadPayload;

        if (chunkData.byteLength === chunkSize) {
          // If the transaction data chunks was never rebalanced this is the only code path that
          // will execute as the incoming chunked data as the will always be equivalent to `chunkSize`.
          chunkPayload = prepareChunkUploadPayload(chunkIndex, chunkData);
        } else if (chunkData.byteLength > chunkSize) {
          // If the incoming chunk data is larger than the expected size of the current chunk
          // it means that the transaction had chunks that were rebalanced to meet the minimum chunk size.
          //
          // It also means that the chunk we're currently processing should be the second to last
          // chunk.
          chunkPayload = prepareChunkUploadPayload(chunkIndex, chunkData.slice(0, chunkSize));
          dataRebalancedIntoFinalChunk = chunkData.slice(chunkSize);
        } else if (chunkData.byteLength < chunkSize && expectedToBeFinalRebalancedChunk) {
          // If this is the final rebalanced chunk, create the upload payload by concatenating the previous
          // chunk's data that was moved into this and the remaining stream data.
          chunkPayload = prepareChunkUploadPayload(
            chunkIndex,
            Buffer.concat([dataRebalancedIntoFinalChunk!, chunkData], dataRebalancedIntoFinalChunk!.length + chunkData.length),
          );
        } else {
          throw Error("Transaction data stream terminated incorrectly.");
        }

        const chunkValid = await validatePath(
          txChunkData.data_root,
          parseInt(chunkPayload.offset),
          0,
          parseInt(chunkPayload.data_size),
          b64UrlToBuffer(chunkPayload.data_path),
        );

        if (!chunkValid) {
          throw new Error(`Unable to validate chunk ${chunkIndex}.`);
        }

        // Upload multiple transaction chunks in parallel to speed up the upload.

        // If we are already at the maximum concurrent chunk upload limit,
        // wait till all of them to complete first before continuing.
        if (activeChunkUploads.length >= MAX_CONCURRENT_CHUNK_UPLOAD_COUNT) {
          await Promise.all(activeChunkUploads);
          // Clear the active chunk uploads array.
          activeChunkUploads.length = 0;
        }

        activeChunkUploads.push(
          AsyncRetry(() => arweave.api.post("chunk", chunkPayload), {
            onRetry: (err) => !FATAL_CHUNK_UPLOAD_ERRORS.includes(err.message),
          }),
        );

        chunkIndex++;
        log(`Chunk process done - ${chunkIndex}`);
      }

      log(`Active chunks to upload - ${activeChunkUploads.length}`);

      await Promise.all(activeChunkUploads);

      if (chunkIndex < chunks.length) {
        throw Error(`Transaction upload incomplete: ${chunkIndex + 1}/${chunks.length} chunks uploaded.`);
      }
    }).catch((e) => {
      log(e.message);
      throw e;
    });
  };
}
