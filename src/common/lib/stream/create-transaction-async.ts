import type Arweave from "../../arweave";
import type { CreateTransactionInterface } from "../../arweave";
import type { TransactionInterface } from "../transaction";
import Transaction from "../transaction";
import { bufferTob64Url } from "../utils";
import type { JWKInterface } from "../wallet";
import { pipeline } from "stream/promises";
import { generateTransactionChunksAsync } from "./generate-transaction-chunks-async";
import AsyncRetry from "async-retry";
/**
 * Creates an Arweave transaction from the piped data stream.
 */
export function createTransactionAsync(
  attributes: Partial<Omit<CreateTransactionInterface, "data">>,
  arweave: Arweave,
  jwk: JWKInterface | null | undefined,
) {
  return async (source: AsyncIterable<Buffer>): Promise<Transaction> => {
    const chunks = await pipeline(source, generateTransactionChunksAsync());

    const txAttrs = Object.assign({}, attributes);

    txAttrs.owner ??= jwk?.n;
    txAttrs.last_tx ??= await AsyncRetry(() => arweave.transactions.getTransactionAnchor(), { retries: 10 });

    const lastChunk = chunks.chunks[chunks.chunks.length - 1];
    const dataByteLength = lastChunk.maxByteRange;

    txAttrs.reward ??= await AsyncRetry(() => arweave.transactions.getPrice(dataByteLength, txAttrs.target), { retries: 5 });

    txAttrs.data_size = dataByteLength.toString();

    const tx = new Transaction(txAttrs as TransactionInterface);

    tx.chunks = chunks;
    tx.data_root = bufferTob64Url(chunks.data_root);

    return tx;
  };
}
