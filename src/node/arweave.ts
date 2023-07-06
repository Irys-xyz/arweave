import type { InitApiConfig, InitFallbackApiConfig } from "../common/types";
import type { AbstractConfig } from "../common";
import CommonArweave from "../common";
import type { ApiConfig } from "../common/lib/api";
import NodeCryptoDriver from "./node-driver";

export class Arweave extends CommonArweave {
  constructor(config?: InitFallbackApiConfig | InitApiConfig | InitApiConfig[] | string[] | URL[], opts?: Omit<AbstractConfig, "apiConfig">) {
    if (!config) config = {};
    if (!Array.isArray(config)) config.url = new URL(config?.url ?? "https://arweave.net");
    super({ crypto: opts?.crypto ?? new NodeCryptoDriver(), ...opts, apiConfig: config as InitApiConfig | InitFallbackApiConfig });
  }
  public static init(apiConfig: ApiConfig): Arweave {
    return new Arweave(apiConfig);
  }
}

export default Arweave;
