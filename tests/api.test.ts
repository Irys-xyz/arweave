import { arweaveInstance } from "./_arweave";
const arweave = arweaveInstance();

const idBinary = "zvpvIoP7TDkf9S3SW6MsxoIvZAMonwAFO_ISSAxBm1A"; // a jpeg image
const idText = "Lv_IaSYGMma5vvD3jmkwl51ELchQ75rNfukltJw3Hh8"; // html page, utf-8
const idJson = "t4B9Dufi14vTWl7nS9eiFfxojeNvmNzBwoUZ0IQMar8"; // json file

describe("API", function () {
  jest.setTimeout(10_000);

  it("should GET json requests", async function () {
    const res = await arweave.api.get(idJson);
    // expect(res.ok).toBe(true);
    // expect(res.bodyUsed).toBe(true);
    expect(res.headers["content-type"]).toBe("application/json; charset=utf-8");
    expect(res.headers["content-type"]).toBe("application/json; charset=utf-8");
    expect(typeof res.data).toBe("object");
    expect(res.data).not.toBeInstanceOf(ArrayBuffer);
  });
  it('should GET binary requests, using "axios" responseType', async function () {
    const res = await arweave.api.get(idBinary, {
      responseType: "arraybuffer",
    });
    // !res.ok status: ${res.status}
    // expect(res.ok).toBe(true);
    // !res.bodyUsed status: ${res.status}
    // expect(res.bodyUsed).toBe(true);
    expect(res.headers["content-type"]).toBe("image/jpeg");
    expect(typeof res.data).toBe("object");
    expect(res.data).toBeInstanceOf(Buffer);
  });
  it("should GET text requests", async function () {
    const res = await arweave.api.get(idText);
    // expect(res.ok).toBe(true);
    // expect(res.bodyUsed).toBe(true);
    expect(res.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(typeof res.data).toBe("string");
  });

  it("should POST GQL queries return a list of results", async function () {
    const txs = (
      await arweave.api.post(
        "/graphql",
        {
          query: `
      {
        transactions(
          tags: [
            { name: "App-Name", values: ["CommunityXYZ"] }
          ]
        ) {
          edges {
            node {
              id
            }
          }
        }
      }`,
        },
        { fallback: { maxAttempts: 1 } },
      )
    ).data.data.transactions.edges;

    expect(Array.isArray(txs)).toBe(true);
    expect(txs.length).toBeGreaterThan(0);
  });
});
