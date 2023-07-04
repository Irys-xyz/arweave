import { MAX_CHUNK_SIZE, MIN_CHUNK_SIZE } from "../../src/common/lib/merkle";
import { createReadStream /* existsSync */ } from "fs";
import { readFile } from "fs/promises";
import { pipeline } from "stream/promises";
// import { promisify } from "util";
import { Readable } from "stream";
import arweave from "../_arweave";
// const exec = promisify(require("child_process").exec);

describe("generateTransactionChunksAsync", () => {
  it("should return the same results as the arweave-js implementation", async () => {
    const filePath = "./tests/fixtures/small-file.enc";

    const chunks = await pipeline(createReadStream(filePath), arweave.stream.generateTransactionChunksAsync());
    const nativeGeneratedChunks = await readFile(filePath).then((data) => arweave.merkle.generateTransactionChunks(data));

    expect(chunks).toMatchObject(nativeGeneratedChunks);
  });

  it("should balance chunks for data with a chunk smaller than MIN_CHUNK_SIZE correctly", async () => {
    const data = Buffer.alloc(MAX_CHUNK_SIZE * 2 + MIN_CHUNK_SIZE - 1);

    const chunks = await pipeline([data], arweave.stream.generateTransactionChunksAsync());
    const nativeGeneratedChunks = await arweave.merkle.generateTransactionChunks(data);

    expect(chunks).toMatchObject(nativeGeneratedChunks);
  });

  it("should be able to generate chunks for files smaller than MIN_CHUNK_SIZE", async () => {
    const filePath = "./tests/fixtures/tiny-file.md";

    const chunks = await pipeline(createReadStream(filePath), arweave.stream.generateTransactionChunksAsync());
    const nativeGeneratedChunks = await readFile(filePath).then((data) => arweave.merkle.generateTransactionChunks(data));

    expect(chunks).toMatchObject(nativeGeneratedChunks);
  });

  it(
    "should be able to generate chunks for really large files",
    async () => {
      // const filePath = "./tests/fixtures/large-file.bin";
      // if (!existsSync(filePath)) {
      //   await exec(`fallocate -l 5G ${filePath}`);
      // }
      async function* generator(): AsyncGenerator<Buffer, void, unknown> {
        const buf = Buffer.alloc(1024);
        for (let i = 0; i < 5120; i++) {
          yield buf;
        }
      }
      const chunks = await pipeline(Readable.from(generator()), arweave.stream.generateTransactionChunksAsync());

      expect(chunks.data_root).toBeTruthy();
    },
    60 * 1000,
  );
});
