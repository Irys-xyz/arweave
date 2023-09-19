import WebArweave from "./arweave";

declare global {
  interface Window {
    Arweave: typeof WebArweave;
  }

  // eslint-disable-next-line no-var
  var Arweave: typeof WebArweave;
}

if (typeof globalThis === "object") {
  globalThis.Arweave = WebArweave;
} else if (typeof self === "object") {
  self.Arweave = WebArweave;
}
