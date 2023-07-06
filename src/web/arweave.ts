import type { ApiConfig } from "../common/lib/api";
import type { AbstractConfig } from "../common";
import CommonArweave from "../common";
import WebCryptoDriver from "./webcrypto-driver";
import type { InitApiConfig, InitFallbackApiConfig } from "../common/types";

export class Arweave extends CommonArweave {
  // constructor(
  //   config: (InitFallbackApiConfig & { fallbackToPeers: true }) | InitApiConfig[] | string[] | URL[],
  // ): InstanceType<typeof Arweave> & { api: FallbackApi };
  constructor(config?: InitFallbackApiConfig | InitApiConfig | InitApiConfig[] | string[] | URL[], opts?: Omit<AbstractConfig, "apiConfig">) {
    if (!config) config = {};
    if (!Array.isArray(config)) config.url = new URL(config?.url ?? "https://arweave.net");
    super({ crypto: opts?.crypto ?? new WebCryptoDriver(), ...opts, apiConfig: config as InitApiConfig | InitFallbackApiConfig });
  }
  public static init(apiConfig: ApiConfig): Arweave {
    return new Arweave(apiConfig);
  }
}

export default Arweave;
