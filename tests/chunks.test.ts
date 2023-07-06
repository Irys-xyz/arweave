import { arweave } from "./_arweave";

const txIds = [
  { id: "rzWsQqZ1XbPOovfJZGcjgF1aDSm5xOjNu9lqmJK7G7c", metadata: { size: "101928", offset: "144425492295454" }, description: "100KB" },
  { id: "Ugl_6hXrsIebROGw3dEPDplwCbde_ndnbAqw9Tl2qR4", metadata: { size: "1291146", offset: "144422200431744" }, description: "1MB" },
  { id: "H2KmHG-X2Crigwb2-EQBpb03YF6Sw9PsvxNRMCBeD7Q", metadata: { size: "67254795", offset: "144422805625601" }, description: "64MB" },
  { id: "wGen4x5A90t8rQA7-uCKOV_5Pn_eMq0iTk2RI8HOEGw", metadata: { size: "116844974", offset: "144423358532260" }, description: "100MB" },
];

describe("Chunks", function () {
  jest.setTimeout(100_000);
  describe.each(txIds)("Given sample $description transaction", ({ id, metadata }) => {
    it("Should get the correct transaction metadata", async () => {
      const peerMetadata = await arweave.chunks.getTransactionMetadata(id);
      expect(peerMetadata.offset).toEqual(metadata.offset);
      expect(peerMetadata.size).toEqual(metadata.size);
    });
    it("should get the correct data", async () => {
      const directData = (await arweave.api.get(`/${id}`, { responseType: "arraybuffer" })).data;
      const data = await arweave.chunks.downloadChunkedData(id);
      expect(Buffer.compare(Buffer.from(directData), Buffer.from(data))).toEqual(0);
    });
  });
});
