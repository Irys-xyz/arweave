import { arweaveInstance } from "./_arweave";

const arweave = arweaveInstance();

// const digestRegex = /^[a-z0-9-_]{43}$/i;

// This transaction was created by using AWS keys
// const externalTransaction = "DheCVCoV7HcZHu5qxQUAlJJRYdfeOkP4oVgFJok2pWg";

describe("External Transactions", function () {
  it("should verify transactions created without arweave-js", async function () {
    // get the transaction created externally
    const transaction = await arweave.transactions.get("DheCVCoV7HcZHu5qxQUAlJJRYdfeOkP4oVgFJok2pWg");

    const verified = await arweave.transactions.verify(transaction);

    expect(verified).toBe(true);

    expect(verified).toBe(true);
  }, 10000);
});
