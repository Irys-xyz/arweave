import type { ApiConfig } from "../common/lib/api";
import type { AbstractConfig } from "../common";
import CommonArweave from "../common";
import WebCryptoDriver from "./webcrypto-driver";

export class Arweave extends CommonArweave {
  /**
   * Constructor for a new `Arweave` instance - this one uses the web crypto driver
   * @param gatways - Specify the Arweave gateway(s) you want to use for requests
   * @param options - Other configuration options
   * @param options.miners - A list of Arweave miners (peers) to use for requests
   * @param options.gateways - A list of Arweave miners (peers) to use for requests
   */
  constructor(gateways?: string | URL | ApiConfig | ApiConfig[] | string[] | URL[], options?: Omit<AbstractConfig, "apiConfig">) {
    super({ crypto: options?.crypto ?? new WebCryptoDriver(), ...options, gateways: gateways ?? "https://arweave.net" });
  }
  public static init(apiConfig: ApiConfig): Arweave {
    return new Arweave(apiConfig);
  }
}
export const WebArweave = Arweave;

export default Arweave;
