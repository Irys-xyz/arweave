import type { AbstractConfig } from "../common";
import CommonArweave from "../common";
import type { ApiConfig } from "../common/lib/api";
import NodeCryptoDriver from "./node-driver";
import { Stream } from "./stream";

export class Arweave extends CommonArweave {
  stream: Stream;
  /**
   * Constructor for a new `Arweave` instance - this one uses the node crypto driver
   * @param gateways - Specify the Arweave gateway(s) you want to use for requests
   * @param options - Other configuration options
   * @param options.miners - A list of Arweave miners (peers) to use for requests
   * @param options.gateways - A list of Arweave miners (peers) to use for requests
   */
  constructor(gateways?: string | URL | ApiConfig | ApiConfig[] | string[] | URL[], options?: Omit<AbstractConfig, "apiConfig">) {
    super({ crypto: options?.crypto ?? new NodeCryptoDriver(), ...options, gateways: gateways ?? "https://arweave.net" });
    this.stream = new Stream({
      deps: { crypto: this.crypto, api: this.api, merkle: this.merkle, transactions: this.transactions, deepHash: this.deepHash },
    });
  }
  public static init(apiConfig: ApiConfig): Arweave {
    return new Arweave(apiConfig);
  }
}
export const NodeArweave = Arweave;
export default Arweave;
