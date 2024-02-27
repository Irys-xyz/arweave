/**
 * @see {@link https://github.com/ArweaveTeam/arweave/blob/fbc381e0e36efffa45d13f2faa6199d3766edaa2/apps/arweave/src/ar_merkle.erl}
 */
import Arweave from "../arweave";
import type CryptoInterface from "./crypto/crypto-interface";
import { concatBuffers } from "./utils";

export type Chunk = {
  dataHash: Uint8Array;
  minByteRange: number;
  maxByteRange: number;
};

type BranchNode = {
  readonly id: Uint8Array;
  readonly type: "branch";
  readonly byteRange: number;
  readonly maxByteRange: number;
  readonly leftChild?: MerkleNode;
  readonly rightChild?: MerkleNode;
};

type LeafNode = {
  readonly id: Uint8Array;
  readonly dataHash: Uint8Array;
  readonly type: "leaf";

  readonly minByteRange: number;
  readonly maxByteRange: number;
};

export type MerkleNode = BranchNode | LeafNode;

export const MAX_CHUNK_SIZE = 256 * 1024;
export const MIN_CHUNK_SIZE = 32 * 1024;
const NOTE_SIZE = 32;
const HASH_SIZE = 32;

export type Proof = {
  offset: number;
  proof: Uint8Array;
};

type MerkleDeps = {
  crypto: Pick<CryptoInterface, "hash">;
};

export class Merkle {
  protected crypto: MerkleDeps["crypto"];
  constructor(opts: { deps: MerkleDeps }) {
    this.crypto = opts.deps.crypto;
  }

  /**
   * Takes the input data and chunks it into (mostly) equal sized chunks.
   * The last chunk will be a bit smaller as it contains the remainder
   * from the chunking process.
   */
  public async chunkData(data: Uint8Array): Promise<Chunk[]> {
    const chunks: Chunk[] = [];

    let rest = data;
    let cursor = 0;

    while (rest.byteLength >= MAX_CHUNK_SIZE) {
      let chunkSize = MAX_CHUNK_SIZE;

      // If the total bytes left will produce a chunk < MIN_CHUNK_SIZE,
      // then adjust the amount we put in this 2nd last chunk.

      const nextChunkSize = rest.byteLength - MAX_CHUNK_SIZE;
      if (nextChunkSize > 0 && nextChunkSize < MIN_CHUNK_SIZE) {
        chunkSize = Math.ceil(rest.byteLength / 2);
        // console.log(`Last chunk will be: ${nextChunkSize} which is below ${MIN_CHUNK_SIZE}, adjusting current to ${chunkSize} with ${rest.byteLength} left.`)
      }

      const chunk = rest.slice(0, chunkSize);
      const dataHash = await this.crypto.hash(chunk);
      cursor += chunk.byteLength;
      chunks.push({
        dataHash,
        minByteRange: cursor - chunk.byteLength,
        maxByteRange: cursor,
      });
      rest = rest.slice(chunkSize);
    }

    chunks.push({
      dataHash: await this.crypto.hash(rest),
      minByteRange: cursor,
      maxByteRange: cursor + rest.byteLength,
    });

    return chunks;
  }

  public async generateLeaves(chunks: Chunk[]): Promise<LeafNode[]> {
    return Promise.all(
      chunks.map(async ({ dataHash, minByteRange, maxByteRange }): Promise<LeafNode> => {
        return {
          type: "leaf",
          id: await this.hash(await Promise.all([this.hash(dataHash), this.hash(intToBuffer(maxByteRange))])),
          dataHash: dataHash,
          minByteRange,
          maxByteRange,
        };
      }),
    );
  }

  /**
   * Builds an arweave merkle tree and gets the root hash for the given input.
   */
  public async computeRootHash(data: Uint8Array): Promise<Uint8Array> {
    const rootNode = await this.generateTree(data);

    return rootNode.id;
  }

  public async generateTree(data: Uint8Array): Promise<MerkleNode> {
    const rootNode = await this.buildLayers(await this.generateLeaves(await this.chunkData(data)));

    return rootNode;
  }

  /**
   * Generates the data_root, chunks & proofs
   * needed for a transaction.
   *
   * This also checks if the last chunk is a zero-length
   * chunk and discards that chunk and proof if so.
   * (we do not need to upload this zero length chunk)
   *
   * @param data
   */
  public async generateTransactionChunks(data: Uint8Array): Promise<{ data_root: Uint8Array; chunks: Chunk[]; proofs: Proof[] }> {
    const chunks = await this.chunkData(data);
    const leaves = await this.generateLeaves(chunks);
    const root = await this.buildLayers(leaves);
    const proofs = await this.generateProofs(root);

    // Discard the last chunk & proof if it's zero length.
    const lastChunk = chunks.slice(-1)[0];
    if (lastChunk.maxByteRange - lastChunk.minByteRange === 0) {
      chunks.splice(chunks.length - 1, 1);
      proofs.splice(proofs.length - 1, 1);
    }

    return {
      data_root: root.id,
      chunks,
      proofs,
    };
  }

  /**
   * Starting with the bottom layer of leaf nodes, hash every second pair
   * into a new branch node, push those branch nodes onto a new layer,
   * and then recurse, building up the tree to it's root, where the
   * layer only consists of two items.
   */
  public async buildLayers(nodes: MerkleNode[], level = 0): Promise<MerkleNode> {
    // If there is only 1 node left, this is going to be the root node
    if (nodes.length < 2) {
      const root = nodes[0];

      // console.log("Root layer", root);

      return root;
    }

    const nextLayer: MerkleNode[] = [];

    for (let i = 0; i < nodes.length; i += 2) {
      nextLayer.push(await this.hashBranch(nodes[i], nodes[i + 1]));
    }

    // console.log("Layer", nextLayer);

    return this.buildLayers(nextLayer, level + 1);
  }

  /**
   * Recursively search through all branches of the tree,
   * and generate a proof for each leaf node.
   */
  public generateProofs(root: MerkleNode): Proof[] {
    const proofs = this.resolveBranchProofs(root);
    if (!Array.isArray(proofs)) {
      return [proofs];
    }
    return arrayFlatten<Proof>(proofs);
  }

  public resolveBranchProofs(node: MerkleNode, proof: Uint8Array = new Uint8Array(), depth = 0): Proof | Proof[] {
    if (node.type == "leaf") {
      return {
        offset: node.maxByteRange - 1,
        proof: concatBuffers([proof, node.dataHash, intToBuffer(node.maxByteRange)]),
      };
    }

    if (node.type == "branch") {
      const partialProof = concatBuffers([proof, node.leftChild!.id!, node.rightChild!.id!, intToBuffer(node.byteRange)]);
      return [
        this.resolveBranchProofs(node.leftChild!, partialProof, depth + 1),
        this.resolveBranchProofs(node.rightChild!, partialProof, depth + 1),
      ] as [Proof, Proof];
    }

    throw new Error(`Unexpected node type`);
  }

  public async validatePath(
    id: Uint8Array,
    dest: number,
    leftBound: number,
    rightBound: number,
    path: Uint8Array,
  ): Promise<false | { offset: number; leftBound: number; rightBound: number; chunkSize: number }> {
    if (rightBound <= 0) {
      return false;
    }

    if (dest >= rightBound) {
      return this.validatePath(id, 0, rightBound - 1, rightBound, path);
    }

    if (dest < 0) {
      return this.validatePath(id, 0, 0, rightBound, path);
    }

    if (path.length == HASH_SIZE + NOTE_SIZE) {
      const pathData = path.slice(0, HASH_SIZE);
      const endOffsetBuffer = path.slice(pathData.length, pathData.length + NOTE_SIZE);

      const pathDataHash = await this.hash([await this.hash(pathData), await this.hash(endOffsetBuffer)]);
      const result = arrayCompare(id, pathDataHash);
      if (result) {
        return {
          offset: rightBound - 1,
          leftBound: leftBound,
          rightBound: rightBound,
          chunkSize: rightBound - leftBound,
        };
      }
      return false;
    }

    const left = path.slice(0, HASH_SIZE);
    const right = path.slice(left.length, left.length + HASH_SIZE);
    const offsetBuffer = path.slice(left.length + right.length, left.length + right.length + NOTE_SIZE);
    const offset = bufferToInt(offsetBuffer);

    const remainder = path.slice(left.length + right.length + offsetBuffer.length);

    const pathHash = await this.hash([await this.hash(left), await this.hash(right), await this.hash(offsetBuffer)]);

    if (arrayCompare(id, pathHash)) {
      if (dest < offset) {
        return await this.validatePath(left, dest, leftBound, Math.min(rightBound, offset), remainder);
      }
      return await this.validatePath(right, dest, Math.max(leftBound, offset), rightBound, remainder);
    }

    return false;
  }

  public async hashBranch(left: MerkleNode, right: MerkleNode): Promise<MerkleNode> {
    if (!right) {
      return left as BranchNode;
    }
    const branch = {
      type: "branch",
      id: await this.hash([await this.hash(left.id), await this.hash(right.id), await this.hash(intToBuffer(left.maxByteRange))]),
      byteRange: left.maxByteRange,
      maxByteRange: right.maxByteRange,
      leftChild: left,
      rightChild: right,
    } as BranchNode;

    return branch;
  }

  protected async hash(data: Uint8Array | Uint8Array[]): Promise<Uint8Array> {
    if (Array.isArray(data)) {
      data = Arweave.utils.concatBuffers(data);
    }

    return new Uint8Array(await this.crypto.hash(data));
  }

  /**
   * Inspect an arweave chunk proof.
   * Takes proof, parses, reads and displays the values for console logging.
   * One proof section per line
   * Format: left,right,offset => hash
   */
  public async debug(proof: Uint8Array, output = ""): Promise<string> {
    if (proof.byteLength < 1) {
      return output;
    }

    const left = proof.slice(0, HASH_SIZE);
    const right = proof.slice(left.length, left.length + HASH_SIZE);
    const offsetBuffer = proof.slice(left.length + right.length, left.length + right.length + NOTE_SIZE);
    const offset = bufferToInt(offsetBuffer);

    const remainder = proof.slice(left.length + right.length + offsetBuffer.length);

    const pathHash = await this.hash([await this.hash(left), await this.hash(right), await this.hash(offsetBuffer)]);

    const updatedOutput = `${output}\n${JSON.stringify(Buffer.from(left))},${JSON.stringify(Buffer.from(right))},${offset} => ${JSON.stringify(
      pathHash,
    )}`;

    return this.debug(remainder, updatedOutput);
  }
}

export function arrayFlatten<T = any>(input: T[]): T[] {
  return input.flat(Infinity) as T[];
}

export function intToBuffer(note: number): Uint8Array {
  const buffer = new Uint8Array(NOTE_SIZE);

  for (let i = buffer.length - 1; i >= 0; i--) {
    const byte = note % 256;
    buffer[i] = byte;
    note = (note - byte) / 256;
  }

  return buffer;
}

export function bufferToInt(buffer: Uint8Array): number {
  let value = 0;
  for (let i = 0; i < buffer.length; i++) {
    value *= 256;
    value += buffer[i];
  }
  return value;
}

export const arrayCompare = (a: Uint8Array | any[], b: Uint8Array | any[]): boolean => a.every((value: any, index: any) => b[index] === value);

export default Merkle;
