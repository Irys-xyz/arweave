import type { ApiConfig } from "../common/lib/api";
import WebArweave from "./arweave";

declare global {
  interface Window {
    Arweave: typeof WebArweave;
  }

  // eslint-disable-next-line no-var
  var Arweave: typeof WebArweave;
}

WebArweave.init = (apiConfig: ApiConfig): InstanceType<typeof WebArweave> => {
  return new WebArweave(apiConfig);
};

if (typeof globalThis === "object") {
  globalThis.Arweave = WebArweave;
} else if (typeof self === "object") {
  self.Arweave = WebArweave;
}
