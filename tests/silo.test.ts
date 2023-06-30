import { SiloResource } from "../src/common/silo";
import { arweaveInstance } from "./_arweave";

const arweave = arweaveInstance();

describe("Silo", function () {
  jest.setTimeout(10000);
  it("should resolve Silo URIs", async function () {
    const siloResource = await arweave.silo.parseUri("someref.1");

    expect(siloResource).toBeInstanceOf(SiloResource);

    expect(siloResource.getAccessKey()).toBe("UOJXTuMn08uUlwg3zSnB");

    const expectedKey = "97e938237d70eda6e88aa0dc3ec14c704505f744c51fbf608e5be1db33c00fb3";

    const actualKey = Buffer.from(siloResource.getEncryptionKey()).toString("hex");

    expect(actualKey).toBe(expectedKey);
  });

  it("should read and write encrypted data", async function () {
    const siloURI = "some-secret.1";

    const wallet = await arweave.wallets.generate();

    const siloTransaction = await arweave.createSiloTransaction(
      {
        data: "something",
      },
      wallet,
      siloURI,
    );

    await arweave.transactions.sign(siloTransaction, wallet);

    const verified = await arweave.transactions.verify(siloTransaction);

    expect(verified).toEqual(true);

    expect(siloTransaction.data).not.toBe("something");

    const decrypted = Buffer.from(await arweave.silo.readTransactionData(siloTransaction, siloURI));

    expect(decrypted.toString()).toBe("something");

    const misdecrypted: Error = await (() => {
      return new Promise((resolve) => {
        arweave.silo.readTransactionData(siloTransaction, "wronguri.1").catch((error) => {
          resolve(error);
        });
      });
    })();

    expect(misdecrypted).toBeInstanceOf(Error);

    expect(misdecrypted).toHaveProperty("message");
    expect(misdecrypted.message).toMatch(/^.*failed to decrypt*$/i);
  });
});
