import type { stringToBuffer, concatBuffers } from "./utils";
import type CryptoInterface from "./crypto/crypto-interface";

// In TypeScript 3.7, could be written as a single type:
// `type DeepHashChunk = Uint8Array | DeepHashChunk[];`
type DeepHashChunk = Uint8Array | DeepHashChunks;
type DeepHashChunks = object & DeepHashChunk[];

type DeepHashDeps = {
  utils: { stringToBuffer: typeof stringToBuffer; concatBuffers: typeof concatBuffers };
  crypto: Pick<CryptoInterface, "hash">;
};

export class DeepHash {
  protected crypto: DeepHashDeps["crypto"];
  protected utils: DeepHashDeps["utils"];

  constructor({ deps }: { deps: { utils: DeepHashDeps["utils"]; crypto: DeepHashDeps["crypto"] } }) {
    this.crypto = deps.crypto;
    this.utils = deps.utils;
  }

  public async deepHash(data: DeepHashChunk): Promise<Uint8Array> {
    if (Array.isArray(data)) {
      const tag = this.utils.concatBuffers([this.utils.stringToBuffer("list"), this.utils.stringToBuffer(data.length.toString())]);

      return await this.deepHashChunks(data, await this.crypto.hash(tag, "SHA-384"));
    }

    const tag = this.utils.concatBuffers([this.utils.stringToBuffer("blob"), this.utils.stringToBuffer(data.byteLength.toString())]);

    const taggedHash = this.utils.concatBuffers([await this.crypto.hash(tag, "SHA-384"), await this.crypto.hash(data, "SHA-384")]);

    return await this.crypto.hash(taggedHash, "SHA-384");
  }

  public async deepHashChunks(chunks: DeepHashChunks, acc: Uint8Array): Promise<Uint8Array> {
    if (chunks.length < 1) return acc;
    const hashPair = this.utils.concatBuffers([acc, await this.deepHash(chunks[0])]);
    const newAcc = await this.crypto.hash(hashPair, "SHA-384");
    return await this.deepHashChunks(chunks.slice(1), newAcc);
  }
}
