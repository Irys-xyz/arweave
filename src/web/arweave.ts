import type { ApiConfig } from "common/lib/api";
import type { AbstractConfig } from "../common";
import CommonArweave from "../common";
import WebCryptoDriver from "./webcrypto-driver";
import type { InitApiConfig } from "common/types";

// declare global {
//   interface Window {
//     IrysArweave: typeof WebArweave;
//   }

//   // eslint-disable-next-line no-var
//   var IrysArweave: typeof WebArweave;
// }

export class WebArweave extends CommonArweave {
  constructor(config: InitApiConfig, opts?: Omit<AbstractConfig, "apiConfig">) {
    config.url = new URL(config.url ?? "http://arweave.net");
    super({ crypto: opts?.crypto ?? new WebCryptoDriver(), ...opts, apiConfig: config as ApiConfig });
  }
  public static init: (apiConfig: ApiConfig) => CommonArweave;
}
export default WebArweave;

// if (typeof globalThis === "object") {
//   globalThis.IrysArweave = WebArweave;
// } else if (typeof self === "object") {
//   self.IrysArweave = WebArweave;
// }
