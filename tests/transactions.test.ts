import * as crypto from "crypto";
import Transaction from "../src/common/lib/transaction";
import { arweaveInstance } from "./_arweave";

const arweave = arweaveInstance();
// const arweaveDirectNode = arweaveInstanceDirectNode();

const digestRegex = /^[a-z0-9-_]{43}$/i;
const liveDataTxid = "bNbA3TEQVL60xlgCcqdz4ZPHFZ711cZ3hmkpGttDt_U";

// These are all identical data (test.mp4)
// const liveDataTxidLarge = "8S0uH6EtRkJOG0b0Q2XsEBSZmbMLnxAwIlNAe_P7ZHg";
// const liveDataTxidLarge = "P4l6aCN97rt4GoyrpG1oKq3A20B2Y24GqmMLWNZlNIk"
// const liveDataTxidLarge = "KDKSOaecDl_IM4E0_0XiApwdrElvb9TnwOzeHt65Sno";
const liveDataTxidLarge = "fvImVd2Lk5lWe0h__qHqMa0iOOsZ9ebzMQy5uQI3HM8";

describe("Transactions", function () {
  jest.setTimeout(30_000);

  it("should create and sign data transactions", async function () {
    const wallet = await arweave.wallets.generate();

    const transaction = await arweave.createTransaction({ data: "test" }, wallet);

    transaction.addTag("test-tag-1", "test-value-1");
    transaction.addTag("test-tag-2", "test-value-2");
    transaction.addTag("test-tag-3", "test-value-3");

    expect(transaction).toBeInstanceOf(Transaction);

    expect(transaction.get("data")).toBe("dGVzdA");

    expect(transaction.last_tx).toMatch(/^[a-z0-9-_]{64}$/i);

    expect(transaction.reward).toMatch(/^[0-9]+$/);

    await arweave.transactions.sign(transaction, wallet);

    expect(transaction.signature).toMatch(/^[a-z0-9-_]+$/i);

    expect(transaction.id).toMatch(digestRegex);

    const verified = await arweave.transactions.verify(transaction);

    expect(verified).toBe(true);

    // @ts-ignore
    // Needs ts-ignoring as tags are readonly so chaning the tag like this isn't
    // normally an allowed operation, but it's a test, so...
    transaction.tags[1].value = "dGVzdDI";

    const verifiedWithModififedTags = await arweave.transactions.verify(transaction);

    expect(verifiedWithModififedTags).toBe(false);
  });

  it("should use JWK.n as transaction owner", async function () {
    const wallet = await arweave.wallets.generate();

    const transaction = await arweave.createTransaction(
      {
        data: "test",
      },
      wallet,
    );

    expect(transaction.get("owner")).toBe(wallet.n);
  });

  it("should use the provided transaction owner attribute", async function () {
    const transaction = await arweave.createTransaction({
      data: "test",
      owner: "owner-test-abc",
    });

    expect(transaction.get("owner")).toBe("owner-test-abc");
  });

  it("should create and sign valid transactions when no owner or JWK provided", async function () {
    const wallet = await arweave.wallets.generate();

    const transaction = await arweave.createTransaction({
      data: "test",
    });

    await arweave.transactions.sign(transaction, wallet);

    expect(transaction.get("owner")).toBe(wallet.n);

    const verified = await arweave.transactions.verify(transaction);

    expect(verified).toBe(true);
  });

  it("should create and sign ar transactions", async function () {
    const wallet = await arweave.wallets.generate();

    const transaction = await arweave.createTransaction(
      {
        target: "GRQ7swQO1AMyFgnuAPI7AvGQlW3lzuQuwlJbIpWV7xk",
        quantity: arweave.utils.arToWinston("1.5").toString(),
      },
      wallet,
    );

    expect(transaction).toBeInstanceOf(Transaction);

    expect(transaction.quantity).toBe("1500000000000");

    expect(transaction.target).toBe("GRQ7swQO1AMyFgnuAPI7AvGQlW3lzuQuwlJbIpWV7xk");
  });

  it("should work with buffers", async function () {
    // jest.setTimeout(10000);

    const wallet = await arweave.wallets.generate();

    const data = crypto.randomBytes(100);

    const transaction = await arweave.createTransaction({ data: data }, wallet);

    transaction.addTag("test-tag-1", "test-value-1");
    transaction.addTag("test-tag-2", "test-value-2");
    transaction.addTag("test-tag-3", "test-value-3");

    expect(transaction).toBeInstanceOf(Transaction);

    expect(Buffer.from(transaction.get("data", { decode: true, string: false }))).toEqual(data);

    expect(transaction.last_tx).toMatch(/^[a-z0-9-_]{64}$/i);

    expect(transaction.reward).toMatch(/^[0-9]+$/);

    await arweave.transactions.sign(transaction, wallet);

    expect(transaction.signature).toMatch(/^[a-z0-9-_]+$/i);

    expect(transaction.id).toMatch(digestRegex);

    const verified = await arweave.transactions.verify(transaction);

    expect(verified).toBe(true);

    // @ts-ignore
    // Needs ts-ignoring as tags are readonly so chaning the tag like this isn't
    // normally an allowed operation, but it's a test, so...
    transaction.tags[1].value = "dGVzdDI";

    const verifiedWithModififedTags = await arweave.transactions.verify(transaction);

    expect(verifiedWithModififedTags).toBe(false);
  });

  it("should get transaction info", async function () {
    const transactionStatus = await arweave.transactions.getStatus(liveDataTxid);
    // arweave.api.config.logging = true
    const transaction = await arweave.transactions.get("erO78Ram7nOEYKdSMfsSho1QWC_iko407AryZdJ2Z3k");

    expect(transactionStatus).toBeInstanceOf(Object);
    expect(transactionStatus.confirmed).toBeInstanceOf(Object);

    expect(Object.keys(transactionStatus.confirmed ?? {})).toEqual(
      expect.arrayContaining(["block_indep_hash", "block_height", "number_of_confirmations"]),
    );

    expect(typeof transactionStatus.confirmed?.block_indep_hash).toBe("string");
    expect(transactionStatus.confirmed?.block_height).toBeGreaterThan(0);
    expect(transactionStatus.confirmed?.number_of_confirmations).toBeGreaterThan(0);

    expect(await arweave.transactions.verify(transaction)).toBe(true);

    transaction.signature = "xxx";

    const verifyResult: Error = await ((): Promise<Error> => {
      return new Promise((resolve) => {
        arweave.transactions.verify(transaction).catch((error) => {
          resolve(error);
        });
      });
    })();

    expect(verifyResult).toBeInstanceOf(Error);

    expect(verifyResult).toHaveProperty("message");
    expect(verifyResult.message).toMatch(/^.*invalid transaction signature.*$/i);
  }, 30_000);

  it("should get transaction data", async function () {
    const txRawData = await arweave.transactions.getData(liveDataTxid);
    expect(txRawData).toEqual(expect.stringContaining("CjwhRE9DVFlQRSBodG1sPgo"));

    const txDecodeData = await arweave.transactions.getData(liveDataTxid, {
      decode: true,
    });
    expect((txDecodeData as Uint8Array).slice(0, 4)).toEqual(new Uint8Array([10, 60, 33, 68]));

    const txDecodeStringData = await arweave.transactions.getData(liveDataTxid, { decode: true, string: true });
    expect(txDecodeStringData).toContain("<title>ARWEAVE / PEER EXPLORER</title>");
  });

  it("should get transaction data > 12MiB from chunks or gateway", async function () {
    const data = (await arweave.transactions.getData(liveDataTxidLarge, {
      decode: true,
    })) as Uint8Array;
    expect(data.byteLength).toBe(14166765);
  }, 300_000);

  // it("should get transaction data > 12MiB from a node", async function () {
  //   jest.setTimeout(150000);
  //   const data = (await arweaveDirectNode.transactions.getData(
  //     liveDataTxidLarge,
  //     { decode: true }
  //   )) as Uint8Array;
  //   expect(data.byteLength).to.equal(14166765);
  // });

  it("should find transactions", async function () {
    const results = await arweave.transactions.search("Silo-Name", "BmjRGIsemI77+eQb4zX8");

    expect(results).toEqual(expect.arrayContaining(["Sgmyo7nUqPpVQWUfK72p5yIpd85QQbhGaWAF-I8L6yE"]));
  });

  it("should support format=2 transaction signing", async function () {
    const jwk = require("./fixtures/arweave-keyfile-fOVzBRTBnyt4VrUUYadBH8yras_-jhgpmNgg-5b3vEw.json");
    const unsignedV2TxFixture = require("./fixtures/unsigned_v2_tx.json");
    const signedV2TxFixture = require("./fixtures/signed_v2_tx.json");

    const data = arweave.utils.b64UrlToBuffer(unsignedV2TxFixture.data);
    const expectedSignature = signedV2TxFixture.signature;
    const expectedDataRoot = signedV2TxFixture.data_root;

    const tx = await arweave.createTransaction(
      {
        format: 2,
        last_tx: "",
        data,
        reward: arweave.utils.arToWinston("100").toString(),
      },
      jwk,
    );

    // Pass an explicit saltLength = 0 to get a deterministic signature
    // that matches the test fixture
    await arweave.transactions.sign(tx, jwk, { saltLength: 0 });

    const dataRoot = arweave.utils.bufferTob64Url(tx.get("data_root", { decode: true, string: false }));
    expect(dataRoot).toBe(expectedDataRoot);
    expect(tx.signature).toBe(expectedSignature);
  });
});
