import type { ApiConfig } from "common/lib/api";
import CommonArweave from "../common";
import WebCryptoDriver from "./webcrypto-driver";

// declare global {
//   interface Window {
//     IrysArweave: typeof WebArweave;
//   }

//   // eslint-disable-next-line no-var
//   var IrysArweave: typeof WebArweave;
// }

export class WebArweave extends CommonArweave {
  constructor(config: { url: string | URL }) {
    const url = new URL(config.url);
    super({ crypto: new WebCryptoDriver(), apiConfig: { url } });
  }
  public static init: (apiConfig: ApiConfig) => CommonArweave;
}
export default WebArweave;

// if (typeof globalThis === "object") {
//   globalThis.IrysArweave = WebArweave;
// } else if (typeof self === "object") {
//   self.IrysArweave = WebArweave;
// }
