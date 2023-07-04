import type { InitApiConfig } from "common/types";
import type { AbstractConfig } from "../common";
import CommonArweave from "../common";
import type { ApiConfig } from "../common/lib/api";
import NodeCryptoDriver from "./node-driver";

export class NodeArweave extends CommonArweave {
  constructor(config: InitApiConfig, opts?: Omit<AbstractConfig, "apiConfig">) {
    config.url = new URL(config.url ?? "http://arweave.net");
    super({ crypto: opts?.crypto ?? new NodeCryptoDriver(), ...opts, apiConfig: config as ApiConfig });
  }
  public static init: (apiConfig: ApiConfig) => CommonArweave;
}

export default NodeArweave;
