import type { ApiConfig } from "../src/common/lib/api";
import Arweave from "../src/node";
// import type { InitApiConfig } from "../src/common/types";
import NodeCryptoDriver from "../src/node/node-driver";

// Arweave.crypto = new NodeCryptoDriver();

export function initInstance(config: ApiConfig): Arweave {
  return new Arweave(config, { crypto: new NodeCryptoDriver() });
}

export const defaultInstance = initInstance({
  url: "https://arweave.net",
  logging: false,
  timeout: 30000,
});

export function arweaveInstance(): Arweave {
  return defaultInstance;
}

export function arweaveInstanceDirectNode(): Arweave {
  console.log(`in function ${arweaveInstanceDirectNode.name} : 'arweave.net' is not a direct node`);
  return initInstance({
    url: "https://arweave.net",
    logging: false,
    timeout: 15000,
  });
}

export default defaultInstance;
export const arweave = defaultInstance;
