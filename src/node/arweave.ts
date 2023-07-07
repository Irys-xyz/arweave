import type { AbstractConfig } from "../common";
import CommonArweave from "../common";
import type { ApiConfig } from "../common/lib/api";
import NodeCryptoDriver from "./node-driver";

export class Arweave extends CommonArweave {
  constructor(config?: string | URL | ApiConfig | ApiConfig[] | string[] | URL[], opts?: Omit<AbstractConfig, "apiConfig">) {
    super({ crypto: opts?.crypto ?? new NodeCryptoDriver(), ...opts, apiConfig: config });
  }
  public static init(apiConfig: ApiConfig): Arweave {
    return new Arweave(apiConfig);
  }
}

export default Arweave;
