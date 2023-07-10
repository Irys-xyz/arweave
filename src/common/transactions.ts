import type Api from "./lib/api";
import type { SignatureOptions } from "./lib/crypto/crypto-interface";
import type CryptoInterface from "./lib/crypto/crypto-interface";
import ArweaveError, { ArweaveErrorType } from "./lib/error";
import Transaction from "./lib/transaction";
import * as ArweaveUtils from "./lib/utils";
import type { JWKInterface } from "./lib/wallet";
import type { SerializedUploader } from "./lib/transaction-uploader";
import { TransactionUploader } from "./lib/transaction-uploader";
import type Chunks from "./chunks";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as _ from "arconnect";
import type FallbackApi from "./lib/fallbackApi";
import type Merkle from "./lib/merkle";
import type { DeepHash } from "./lib/deepHash";
import { Readable } from "stream";
declare const arweaveWallet: Window["arweaveWallet"];

export type TransactionConfirmedData = {
  block_indep_hash: string;
  block_height: number;
  number_of_confirmations: number;
};
export type TransactionStatusResponse = {
  status: number;
  confirmed: TransactionConfirmedData | null;
};

export default class Transactions {
  private api: Api | FallbackApi;

  private crypto: CryptoInterface;

  private chunks: Chunks;
  protected merkle: Merkle;
  protected deepHash: DeepHash;

  constructor({ deps }: { deps: { crypto: CryptoInterface; api: Api | FallbackApi; chunks: Chunks; merkle: Merkle; deepHash: DeepHash } }) {
    this.api = deps.api;
    this.crypto = deps.crypto;
    this.chunks = deps.chunks;
    this.merkle = deps.merkle;
    this.deepHash = deps.deepHash;
  }

  public getTransactionAnchor(): Promise<string> {
    /**
     * Maintain compatibility with erdjs which sets a global axios.defaults.transformResponse
     * in order to overcome some other issue in:  https://github.com/axios/axios/issues/983
     *
     * However, this introduces a problem with ardrive-js, so we will enforce
     * config =  {transformResponse: []} where we do not require a transform
     */
    return this.api.get(`tx_anchor`, { transformResponse: [] }).then((response) => {
      return response.data;
    });
  }

  public getPrice(byteSize: number, targetAddress?: string): Promise<string> {
    const endpoint = targetAddress ? `price/${byteSize}/${targetAddress}` : `price/${byteSize}`;

    return this.api
      .get(endpoint, {
        transformResponse: [
          /**
           * We need to specify a response transformer to override
           * the default JSON.parse behavior, as this causes
           * winston to be converted to a number and we want to
           * return it as a winston string.
           * @param data
           */
          function (data: any): string {
            return data;
          },
        ],
      })
      .then((response) => {
        return response.data;
      });
  }

  public async get(id: string): Promise<Transaction> {
    const response = await this.api.get(`tx/${id}`);

    if (response.status == 200) {
      const data_size = parseInt(response.data.data_size);
      if (response.data.format >= 2 && data_size > 0 && data_size <= 1024 * 1024 * 12) {
        const data = await this.getData(id);
        return new Transaction({
          attributes: {
            ...response.data,
            data,
          },
          deps: { merkle: this.merkle, deepHash: this.deepHash },
        });
      }
      return new Transaction({
        attributes: {
          ...response.data,
          format: response.data.format || 1,
        },
        deps: { merkle: this.merkle, deepHash: this.deepHash },
      });
    }

    if (response.status === 404) {
      throw new ArweaveError(ArweaveErrorType.TX_NOT_FOUND);
    }

    if (response.status === 410) {
      throw new ArweaveError(ArweaveErrorType.TX_FAILED);
    }

    throw new ArweaveError(ArweaveErrorType.TX_INVALID);
  }

  public fromRaw(attributes: object): Transaction {
    return new Transaction({ attributes, deps: { merkle: this.merkle, deepHash: this.deepHash } });
  }

  public getStatus(id: string): Promise<TransactionStatusResponse> {
    return this.api.get(`tx/${id}/status`).then((response) => {
      if (response.status === 200) {
        return {
          status: 200,
          confirmed: response.data,
        };
      }
      return {
        status: response.status,
        confirmed: null,
      };
    });
  }

  public async getData(id: string): Promise<string | Uint8Array> {
    let data: Uint8Array | undefined = undefined;

    try {
      data = (await this.api.get(`/${id}`, { responseType: "arraybuffer" })).data;
    } catch (error) {
      console.error(`Error while trying to download contiguous data from gateway cache for ${id}`);

      console.error(error);
    }

    if (!data) {
      console.warn(`Falling back to chunks for ${id}`);
      try {
        data = await this.chunks.downloadChunkedData(id);
      } catch (error) {
        console.error(`Error while trying to download chunked data for ${id}`);
        console.error(error);
      }
    }

    if (!data) {
      throw new Error(`${id} data was not found!`);
    }

    return data;
  }

  public async getDataAsStream(id: string): Promise<Readable> {
    let data: Readable | undefined = undefined;

    try {
      data = (await this.api.get(`/${id}`, { responseType: "stream" })).data;
    } catch (error) {
      console.error(`Error while trying to download contiguous data from gateway cache for ${id}`);
      console.error(error);
    }

    if (!data) {
      console.warn(`Falling back to chunks for ${id}`);
      try {
        const gen = this.chunks.concurrentDownloadChunkedData(id);
        data = Readable.from(gen);
      } catch (error) {
        console.error(`Error while trying to download chunked data for ${id}`);
        console.error(error);
      }
    }

    if (!data) {
      throw new Error(`${id} data was not found!`);
    }

    return data;
  }

  public async sign(
    transaction: Transaction,
    jwk?: JWKInterface | "use_wallet", // "use_wallet" for backwards compatibility only
    options?: SignatureOptions,
  ): Promise<void> {
    /** Non-exhaustive (only checks key names), but previously no jwk checking was done */
    const isJwk = (obj: object): boolean => {
      let valid = true;
      ["n", "e", "d", "p", "q", "dp", "dq", "qi"].map((key) => !(key in obj) && (valid = false));
      return valid;
    };
    const validJwk = typeof jwk === "object" && isJwk(jwk);
    const externalWallet = typeof arweaveWallet === "object";

    if (!validJwk && !externalWallet) {
      throw new Error(`No valid JWK or external wallet found to sign transaction.`);
    } else if (externalWallet) {
      try {
        const existingPermissions = await arweaveWallet.getPermissions();

        if (!existingPermissions.includes("SIGN_TRANSACTION")) await arweaveWallet.connect(["SIGN_TRANSACTION"]);
      } catch {
        // Permission is already granted
      }

      const signedTransaction = await arweaveWallet.sign(transaction, options);

      transaction.setSignature({
        id: signedTransaction.id,
        owner: signedTransaction.owner,
        reward: signedTransaction.reward,
        tags: signedTransaction.tags,
        signature: signedTransaction.signature,
      });
    } else if (validJwk) {
      transaction.setOwner(jwk.n);

      const dataToSign = await transaction.getSignatureData();
      const rawSignature = await this.crypto.sign(jwk, dataToSign, options);
      const id = await this.crypto.hash(rawSignature);

      transaction.setSignature({
        id: ArweaveUtils.bufferTob64Url(id),
        owner: jwk.n,
        signature: ArweaveUtils.bufferTob64Url(rawSignature),
      });
    } else {
      // can't get here, but for sanity we'll throw an error.
      throw new Error(`An error occurred while signing. Check wallet is valid`);
    }
  }

  public async verify(transaction: Transaction): Promise<boolean> {
    const signaturePayload = await transaction.getSignatureData();

    /**
     * The transaction ID should be a SHA-256 hash of the raw signature bytes, so this needs
     * to be recalculated from the signature and checked against the transaction ID.
     */
    const rawSignature = transaction.get("signature", {
      decode: true,
      string: false,
    });

    const expectedId = ArweaveUtils.bufferTob64Url(await this.crypto.hash(rawSignature));

    if (transaction.id !== expectedId) {
      throw new Error(`Invalid transaction signature or ID! The transaction ID doesn't match the expected SHA-256 hash of the signature.`);
    }

    /**
     * Now verify the signature is valid and signed by the owner wallet (owner field = originating wallet public key).
     */
    return this.crypto.verify(transaction.owner, signaturePayload, rawSignature);
  }

  public async post(transaction: Transaction | Buffer | string | object): Promise<{ status: number; statusText: string; data: any }> {
    if (typeof transaction === "string") {
      transaction = new Transaction({ attributes: JSON.parse(transaction as string), deps: { merkle: this.merkle, deepHash: this.deepHash } });
    } else if (typeof (transaction as any).readInt32BE === "function") {
      transaction = new Transaction({ attributes: JSON.parse(transaction.toString()), deps: { merkle: this.merkle, deepHash: this.deepHash } });
    } else if (typeof transaction === "object" && !(transaction instanceof Transaction)) {
      transaction = new Transaction({ attributes: transaction as object, deps: { merkle: this.merkle, deepHash: this.deepHash } });
    }

    if (!(transaction instanceof Transaction)) {
      throw new Error(`Must be Transaction object`);
    }

    if (!transaction.chunks) {
      await transaction.prepareChunks(transaction.data);
    }

    const uploader = await this.getUploader(transaction, transaction.data);

    // Emulate existing error & return value behavior.
    try {
      while (!uploader.isComplete) {
        await uploader.uploadChunk();
      }
    } catch (e) {
      if (uploader.lastResponseStatus > 0) {
        return {
          status: uploader.lastResponseStatus,
          statusText: uploader.lastResponseError,
          data: {
            error: uploader.lastResponseError,
          },
        };
      }
      throw e;
    }

    return {
      status: 200,
      statusText: "OK",
      data: {},
    };
  }

  /**
   * Gets an uploader than can be used to upload a transaction chunk by chunk, giving progress
   * and the ability to resume.
   *
   * Usage example:
   *
   * ```
   * const uploader = arweave.transactions.getUploader(transaction);
   * while (!uploader.isComplete) {
   *   await uploader.uploadChunk();
   *   console.log(`${uploader.pctComplete}%`);
   * }
   * ```
   *
   * @param upload a Transaction object, a previously save progress object, or a transaction id.
   * @param data the data of the transaction. Required when resuming an upload.
   */
  public async getUploader(upload: Transaction | SerializedUploader | string, data?: Uint8Array | ArrayBuffer): Promise<TransactionUploader> {
    let uploader!: TransactionUploader;

    if (data instanceof ArrayBuffer) {
      data = new Uint8Array(data);
    }

    if (upload instanceof Transaction) {
      if (!data) {
        data = upload.data;
      }

      if (!(data instanceof Uint8Array)) {
        throw new Error("Data format is invalid");
      }

      if (!upload.chunks) {
        await upload.prepareChunks(data);
      }

      uploader = new TransactionUploader({
        transaction: upload,
        deps: { api: this.api, crypto: this.crypto, merkle: this.merkle, deepHash: this.deepHash },
      });

      if (!uploader.data || uploader.data.length === 0) {
        uploader.data = data;
      }
    } else {
      if (typeof upload === "string") {
        upload = await TransactionUploader.fromTransactionId(this.api, upload);
      }

      if (!data || !(data instanceof Uint8Array)) {
        throw new Error(`Must provide data when resuming upload`);
      }

      // upload should be a serialized upload.
      uploader = await TransactionUploader.fromSerialized({
        deps: { api: this.api, merkle: this.merkle, crypto: this.crypto, deepHash: this.deepHash },
        serialized: upload,
        data,
      });
    }

    return uploader;
  }

  /**
   * Async generator version of uploader
   *
   * Usage example:
   *
   * ```
   * for await (const uploader of arweave.transactions.upload(tx)) {
   *  console.log(`${uploader.pctComplete}%`);
   * }
   * ```
   *
   * @param upload a Transaction object, a previously save uploader, or a transaction id.
   * @param data the data of the transaction. Required when resuming an upload.
   */
  public async *upload(
    upload: Transaction | SerializedUploader | string,
    data: Uint8Array,
  ): AsyncGenerator<TransactionUploader, TransactionUploader> {
    const uploader = await this.getUploader(upload, data);

    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      yield uploader;
    }

    return uploader;
  }
}
