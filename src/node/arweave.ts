import CommonArweave from "../common";
import type { ApiConfig } from "../common/lib/api";
import NodeCryptoDriver from "./node-driver";

export class NodeArweave extends CommonArweave {
  constructor(config: { url: string | URL }) {
    const url = new URL(config.url);
    super({ crypto: new NodeCryptoDriver(), apiConfig: { url } });
  }
  public static init: (apiConfig: ApiConfig) => CommonArweave;
}

export default NodeArweave;
