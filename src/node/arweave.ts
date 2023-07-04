import type { InitApiConfig } from "../common/types";
import type { AbstractConfig } from "../common";
import CommonArweave from "../common";
import type { ApiConfig } from "../common/lib/api";
import NodeCryptoDriver from "./node-driver";

export class NodeArweave extends CommonArweave {
  constructor(config: InitApiConfig | InitApiConfig[] | string[] | URL[], opts?: Omit<AbstractConfig, "apiConfig">) {
    if (!Array.isArray(config)) config.url = new URL(config.url ?? "https://arweave.net");
    super({ crypto: opts?.crypto ?? new NodeCryptoDriver(), ...opts, apiConfig: config as ApiConfig });
  }
  public static init: (apiConfig: ApiConfig) => CommonArweave;
}

export default NodeArweave;
