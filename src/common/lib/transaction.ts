/* eslint-disable no-case-declarations */
import * as ArweaveUtils from "./utils";
import type { DeepHash } from "./deepHash";
import type { Chunk, Proof } from "./merkle";
import type { Merkle } from "./merkle";
import { bufferTob64Url } from "./utils";

class BaseObject {
  [key: string]: any;

  public get(field: string): string;
  public get(field: string, options: { decode: true; string: false }): Uint8Array;
  public get(field: string, options: { decode: true; string: true }): string;

  public get(
    field: string,
    options?: {
      string?: boolean;
      decode?: boolean;
    },
  ): string | Uint8Array | Tag[] {
    if (!Object.getOwnPropertyNames(this).includes(field)) {
      throw new Error(`Field "${field}" is not a property of the Arweave Transaction class.`);
    }

    // Handle fields that are Uint8Arrays.
    // To maintain compat we encode them to b64url
    // if decode option is not specificed.
    if (this[field] instanceof Uint8Array) {
      if (options && options.decode && options.string) {
        return ArweaveUtils.bufferToString(this[field]);
      }
      if (options && options.decode && !options.string) {
        return this[field];
      }
      return ArweaveUtils.bufferTob64Url(this[field]);
    }

    if (this[field] instanceof Array) {
      if (options?.decode !== undefined || options?.string !== undefined) {
        if (field === "tags") {
          console.warn(`Did you mean to use 'transaction["tags"]' ?`);
        }
        throw new Error(`Cannot decode or stringify an array.`);
      }
      return this[field];
    }

    if (options && options.decode == true) {
      if (options && options.string) {
        return ArweaveUtils.b64UrlToString(this[field]);
      }

      return ArweaveUtils.b64UrlToBuffer(this[field]);
    }

    return this[field];
  }
}

export class Tag extends BaseObject {
  readonly name: string;
  readonly value: string;

  public constructor(name: string, value: string /* _decode = false */) {
    super();
    this.name = name;
    this.value = value;
  }
}

export type TransactionInterface = {
  format: number;
  id: string;
  last_tx: string;
  owner: string;
  tags: Tag[];
  target: string;
  quantity: string;
  data: Uint8Array;
  reward: string;
  signature: string;
  data_size: string;
  data_root: string;
};

export default class Transaction extends BaseObject implements TransactionInterface {
  public readonly format: number = 2;
  public id = "";
  public readonly last_tx: string = "";
  public owner = "";
  public tags: Tag[] = [];
  public readonly target: string = "";
  public readonly quantity: string = "0";
  public readonly data_size: string = "0";
  public data: Uint8Array = new Uint8Array();
  public data_root = "";
  public reward = "0";
  public signature = "";

  protected merkle: Merkle;
  protected deepHash: DeepHash;
  // Computed when needed.
  public chunks?: {
    data_root: Uint8Array;
    chunks: Chunk[];
    proofs: Proof[];
  };

  public constructor({ attributes, deps }: { attributes: Partial<TransactionInterface>; deps: { merkle: Merkle; deepHash: DeepHash } }) {
    super();
    this.merkle = deps.merkle;
    this.deepHash = deps.deepHash;
    Object.assign(this, attributes);

    // If something passes in a Tx that has been toJSON'ed and back,
    // or where the data was filled in from /tx/data endpoint.
    // data will be b64url encoded, so decode it.
    if (typeof this.data === "string") {
      this.data = ArweaveUtils.b64UrlToBuffer(this.data as string);
    }

    if (attributes.tags) {
      this.tags = attributes.tags.map((tag: { name: string; value: string }) => {
        return new Tag(tag.name, tag.value);
      });
    }
  }

  public addTag(name: string, value: string): void {
    this.tags.push(new Tag(ArweaveUtils.stringToB64Url(name), ArweaveUtils.stringToB64Url(value)));
  }

  public toJSON(): {
    format: number;
    id: string;
    last_tx: string;
    owner: string;
    tags: Tag[];
    target: string;
    quantity: string;
    data: string;
    data_size: string;
    data_root: string;
    data_tree: any;
    reward: string;
    signature: string;
  } {
    return {
      format: this.format,
      id: this.id,
      last_tx: this.last_tx,
      owner: this.owner,
      tags: this.tags,
      target: this.target,
      quantity: this.quantity,
      data: ArweaveUtils.bufferTob64Url(this.data),
      data_size: this.data_size,
      data_root: this.data_root,
      data_tree: this.data_tree,
      reward: this.reward,
      signature: this.signature,
    };
  }

  public setOwner(owner: string): void {
    this.owner = owner;
  }

  public setSignature({ id, owner, reward, tags, signature }: { id: string; owner: string; reward?: string; tags?: Tag[]; signature: string }): void {
    this.id = id;
    this.owner = owner;
    if (reward) this.reward = reward;
    if (tags) this.tags = tags;
    this.signature = signature;
  }

  public async prepareChunks(data: Uint8Array): Promise<void> {
    // Note: we *do not* use `this.data`, the caller may be
    // operating on a transaction with an zero length data field.
    // This function computes the chunks for the data passed in and
    // assigns the result to this transaction. It should not read the
    // data *from* this transaction.

    if (!this.chunks && data.byteLength > 0) {
      this.chunks = await this.merkle.generateTransactionChunks(data);
      this.data_root = bufferTob64Url(this.chunks.data_root);
    }

    if (!this.chunks && data.byteLength === 0) {
      this.chunks = {
        chunks: [],
        data_root: new Uint8Array(),
        proofs: [],
      };
      this.data_root = "";
    }
  }

  // Returns a chunk in a format suitable for posting to /chunk.
  // Similar to `prepareChunks()` this does not operate `this.data`,
  // instead using the data passed in.
  public getChunk(
    idx: number,
    data: Uint8Array,
  ): {
    data_root: string;
    data_size: string;
    data_path: string;
    offset: string;
    chunk: string;
  } {
    if (!this.chunks) {
      throw new Error(`Chunks have not been prepared`);
    }
    const proof = this.chunks.proofs[idx];
    const chunk = this.chunks.chunks[idx];
    return {
      data_root: this.data_root,
      data_size: this.data_size,
      data_path: ArweaveUtils.bufferTob64Url(proof.proof),
      offset: proof.offset.toString(),
      chunk: ArweaveUtils.bufferTob64Url(data.slice(chunk.minByteRange, chunk.maxByteRange)),
    };
  }

  public async getSignatureData(): Promise<Uint8Array> {
    switch (this.format) {
      case 1:
        const tags = this.tags.reduce((accumulator: Uint8Array, tag: Tag) => {
          return ArweaveUtils.concatBuffers([
            accumulator,
            tag.get("name", { decode: true, string: false }),
            tag.get("value", { decode: true, string: false }),
          ]);
        }, new Uint8Array());

        return ArweaveUtils.concatBuffers([
          this.get("owner", { decode: true, string: false }),
          this.get("target", { decode: true, string: false }),
          this.get("data", { decode: true, string: false }),
          ArweaveUtils.stringToBuffer(this.quantity),
          ArweaveUtils.stringToBuffer(this.reward),
          this.get("last_tx", { decode: true, string: false }),
          tags,
        ]);
      case 2:
        if (!this.data_root) {
          await this.prepareChunks(this.data);
        }

        const tagList: [Uint8Array, Uint8Array][] = this.tags.map((tag) => [
          tag.get("name", { decode: true, string: false }),
          tag.get("value", { decode: true, string: false }),
        ]);

        return await this.deepHash.deepHash([
          ArweaveUtils.stringToBuffer(this.format.toString()),
          this.get("owner", { decode: true, string: false }),
          this.get("target", { decode: true, string: false }),
          ArweaveUtils.stringToBuffer(this.quantity),
          ArweaveUtils.stringToBuffer(this.reward),
          this.get("last_tx", { decode: true, string: false }),
          tagList,
          ArweaveUtils.stringToBuffer(this.data_size),
          this.get("data_root", { decode: true, string: false }),
        ]);
      default:
        throw new Error(`Unexpected transaction format: ${this.format}`);
    }
  }
}
