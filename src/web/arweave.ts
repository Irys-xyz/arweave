import type { ApiConfig } from "../common/lib/api";
import type { AbstractConfig } from "../common";
import CommonArweave from "../common";
import WebCryptoDriver from "./webcrypto-driver";

export class Arweave extends CommonArweave {
  constructor(config?: string | URL | ApiConfig | ApiConfig[] | string[] | URL[], opts?: Omit<AbstractConfig, "apiConfig">) {
    super({ crypto: opts?.crypto ?? new WebCryptoDriver(), ...opts, apiConfig: config ?? "https://arweave.net" });
  }
  public static init(apiConfig: ApiConfig): Arweave {
    return new Arweave(apiConfig);
  }
}

export default Arweave;
