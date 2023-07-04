import { arweaveInstance } from "./_arweave";
const blockIndepHash = "zbUPQFA4ybnd8h99KI9Iqh4mogXJibr0syEwuJPrFHhOhld7XBMOUDeXfsIGvYDp";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const block = require(`./fixtures/block_${blockIndepHash}.json`);

const arweave = arweaveInstance();

describe("Blocks", function () {
  jest.setTimeout(50000);

  // const blockTypeFields: string[] = [
  //   "nonce",
  //   "previous_block",
  //   "timestamp",
  //   "last_retarget",
  //   "diff",
  //   "height",
  //   "hash",
  //   "indep_hash",
  //   "txs",
  //   "tx_root",
  //   "wallet_list",
  //   "reward_addr",
  //   "tags",
  //   "reward_pool",
  //   "weave_size",
  //   "block_size",
  //   "cumulative_diff",
  //   "hash_list_merkle",
  // ];

  it("should get block's data by its indep_hash", async function () {
    // given
    // https://arweave.net/block/hash/zbUPQFA4ybnd8h99KI9Iqh4mogXJibr0syEwuJPrFHhOhld7XBMOUDeXfsIGvYDp

    // when
    const result = (await arweave.blocks.getByHash(blockIndepHash)) as any; // note: any to be able to access object values by keys.

    // then
    expect(block).toEqual(result);
  });
  it("should get block's data by it's height", async () => {
    const blockHeight = 711150;
    const result = await arweave.blocks.getByHeight(blockHeight);
    expect(result).toEqual(block);
  });
});
