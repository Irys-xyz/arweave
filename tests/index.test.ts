import Api from "../src/common/lib/api";
import NodeCryptoDriver from "../src/node/node-driver";
import Network from "../src/common/network";
import Silo from "../src/common/silo";
import Transactions from "../src/common/transactions";
import Wallets from "../src/common/wallets";

import { arweaveInstance, initInstance } from "./_arweave";

const arweave = arweaveInstance();

describe("Initialization", function () {
  jest.setTimeout(100000);

  it("should have components", function () {
    expect(arweave.api).toBeInstanceOf(Api);

    expect(arweave.transactions).toBeInstanceOf(Transactions);

    expect(arweave.wallets).toBeInstanceOf(Wallets);

    expect(arweave.network).toBeInstanceOf(Network);

    expect(arweave.crypto).toBeInstanceOf(NodeCryptoDriver);

    expect(arweave.silo).toBeInstanceOf(Silo);
  });

  it("should handle default ports", function () {
    expect(initInstance({ port: 1234 }).api.config.port).toBe(1234);
    expect(initInstance({ protocol: "http" }).api.config.port).toBe(80);
    expect(initInstance({ protocol: "https" }).api.config.port).toBe(443);
    expect(initInstance({}).api.config.port).toBe(80);
  });

  it("should handle the default host", function () {
    expect(initInstance({}).api.config.host).toBe("127.0.0.1");
    expect(initInstance({ host: "specific-host.example" }).api.config.host).toBe("specific-host.example");
  });
});

describe("Network Info", function () {
  it("should get network info", async function () {
    const info = await arweave.network.getInfo();
    const peers = await arweave.network.getPeers();

    expect(info).toBeInstanceOf(Object);

    expect(Object.keys(info)).toEqual(expect.arrayContaining(["height", "current", "release", "version", "blocks"]));

    expect(info.height).toBeGreaterThan(0);

    expect(Array.isArray(peers)).toBe(true);
  }, 10000);
});

// describe('API ', ()=> {
//   it('tests that API can POST requests', async function(){

//   })
// })
