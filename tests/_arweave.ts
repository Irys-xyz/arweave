import Arweave from "../src/common/arweave";
import NodeCryptoDriver from "../src/node/node-driver";
import type { ApiConfig } from "../src/common/lib/api";

Arweave.crypto = new NodeCryptoDriver();

export function initInstance(config: ApiConfig) {
  return new Arweave(config);
}

export const defaultInstance = initInstance({
  host: "arweave.net",
  protocol: "https",
  port: 443,
  logging: false,
  timeout: 30000,
});

export function arweaveInstance() {
  return defaultInstance;
}

export function arweaveInstanceDirectNode() {
  console.log(`in function ${arweaveInstanceDirectNode.name} : 'arweave.net' is not a direct node`);
  return initInstance({
    host: "arweave.net",
    protocol: "https",
    port: 443,
    logging: false,
    timeout: 15000,
  });
}

export default defaultInstance;
