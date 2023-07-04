import type { ApiConfig } from "../common/lib/api";
import type { AbstractConfig } from "../common";
import CommonArweave from "../common";
import WebCryptoDriver from "./webcrypto-driver";
import type { InitApiConfig } from "../common/types";

export class WebArweave extends CommonArweave {
  constructor(config: InitApiConfig | InitApiConfig[] | string[] | URL[], opts?: Omit<AbstractConfig, "apiConfig">) {
    if (!Array.isArray(config)) config.url = new URL(config.url ?? "https://arweave.net");
    super({ crypto: opts?.crypto ?? new WebCryptoDriver(), ...opts, apiConfig: config as ApiConfig });
  }
  public static init: (apiConfig: ApiConfig) => WebArweave;
}

export default WebArweave;
