import WebArweave from "./arweave";

declare global {
  interface Window {
    Arweave: typeof WebArweave;
  }

  // eslint-disable-next-line no-var
  var Arweave: typeof WebArweave;
}

// Arweave.init = (apiConfig: ApiConfig): InstanceType<typeof Arweave> => {
//   return new Arweave(apiConfig);
// };

if (typeof globalThis === "object") {
  globalThis.Arweave = WebArweave;
} else if (typeof self === "object") {
  self.Arweave = WebArweave;
}
