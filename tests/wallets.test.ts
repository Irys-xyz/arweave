import { arweaveInstance } from "./_arweave";

const arweave = arweaveInstance();

const digestRegex = /^[a-z0-9-_]{43}$/i;
const liveAddressBalance = "498557055636";
const liveAddress = "9_666Wkk2GzL0LGd3xhb0jY7HqNy71BaV4sULQlJsBQ";
const liveTxid = "CE-1SFiXqWUEu0aSTebE6LC0-5JBAc3IAehYGwdF5iI";

describe("Wallets and keys", function () {
  jest.setTimeout(20000);
  it("should generate valid JWKs", async function () {
    const walletA = await arweave.wallets.generate();
    const walletB = await arweave.wallets.generate();

    expect(walletA).toBeInstanceOf(Object);

    expect(Object.keys(walletA)).toEqual(expect.arrayContaining(["kty", "n", "e", "d", "p", "q", "dp", "dq", "qi"]));

    expect(walletA.kty).toBe("RSA");

    expect(walletA.e).toBe("AQAB");

    expect(walletA.n).toMatch(/^[a-z0-9-_]{683}$/i);

    expect(walletA.d).toMatch(/^[a-z0-9-_]{683}$/i);

    const addressA = await arweave.wallets.jwkToAddress(walletA);
    const addressB = await arweave.wallets.jwkToAddress(walletB);

    expect(typeof addressA).toBe("string");

    expect(addressA).toMatch(digestRegex);

    expect(addressB).toMatch(digestRegex);

    expect(addressA).not.toBe(addressB);
  });

  it("should get wallet info", async function () {
    const wallet = await arweave.wallets.generate();

    const address = await arweave.wallets.jwkToAddress(wallet);

    const balance = await arweave.wallets.getBalance(address);

    const lastTx = await arweave.wallets.getLastTransactionID(address);

    expect(typeof balance).toBe("string");

    expect(balance).toBe("0");

    expect(typeof lastTx).toBe("string");

    expect(lastTx).toBe("");

    const balanceB = await arweave.wallets.getBalance(liveAddress);

    const lastTxB = await arweave.wallets.getLastTransactionID(liveAddress);

    expect(balanceB).toBe(liveAddressBalance);

    expect(typeof lastTxB).toBe("string");

    expect(lastTxB).toBe(liveTxid);
  });

  it("Should resolve JWK to address", async function () {
    const jwk = require("./fixtures/arweave-keyfile-fOVzBRTBnyt4VrUUYadBH8yras_-jhgpmNgg-5b3vEw.json");

    const address = await arweave.wallets.jwkToAddress(jwk);

    expect(address).toBe("fOVzBRTBnyt4VrUUYadBH8yras_-jhgpmNgg-5b3vEw");
  });

  it("Should resolve public key to address", async function () {
    const jwk = require("./fixtures/arweave-keyfile-fOVzBRTBnyt4VrUUYadBH8yras_-jhgpmNgg-5b3vEw.json");

    const address = await arweave.wallets.ownerToAddress(jwk.n);

    expect(address).toEqual("fOVzBRTBnyt4VrUUYadBH8yras_-jhgpmNgg-5b3vEw");
  });
});
