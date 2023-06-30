import Arweave from "../common";
import type { ApiConfig } from "../common/lib/api";

Arweave.init = function (apiConfig: ApiConfig = {}): Arweave {
  return new Arweave(apiConfig);
};

export = Arweave;
