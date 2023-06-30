const globals = <any>global;

// The web distro will attach to the browser's global object so we just
// need to mock a global self object with a subtle crypto stub
// to make this test work.
globals.crypto = {
  subtle: {
    generateKey: async () => {},
    importKey: async () => {},
    exportKey: async () => {},
    digest: async () => {},
    sign: async () => {},
  },
};

globals.self = global;

describe("Node distribution", function () {
  it("should initialize from compiled node dist", async function () {
    const dist = require("../node");

    expect(typeof dist).toBeInstanceOf(Function);

    expect(typeof dist.init).toBeInstanceOf(Function);

    const instance = dist.init({ host: "arweave.net", logging: false });

    expect(instance.api.constructor.name).toBe("Api");

    expect(instance.transactions.constructor.name).toBe("Transactions");

    expect(instance.wallets.constructor.name).toBe("Wallets");

    expect(instance.network.constructor.name).toBe("Network");

    expect(instance.crypto.constructor.name).toBe("NodeCryptoDriver");

    expect(instance.silo.constructor.name).toBe("Silo");
  });
});

describe("Web distribution", function () {
  it("should initialize from web compiled dist", async function () {
    require("../web");

    const dist = globals.self.Arweave;

    expect(dist).toBeInstanceOf(Function);

    expect(dist.init).toBeInstanceOf(Function);

    const instance = dist.init({
      host: "arweave.net",
      protocol: "https",
      port: "443",
      logging: false,
    });

    expect(instance.api.constructor.name).toBe("Api");

    expect(instance.transactions.constructor.name).toBe("Transactions");

    expect(instance.wallets.constructor.name).toBe("Wallets");

    expect(instance.network.constructor.name).toBe("Network");

    expect(instance.crypto.constructor.name).toBe("WebCryptoDriver");

    expect(instance.silo.constructor.name).toBe("Silo");
  });

  it("should initialize from web bundle", async function () {
    require("../bundles/web.bundle");

    const dist = globals.self.Arweave;

    expect(dist).toBeInstanceOf(Function);

    expect(dist.init).toBeInstanceOf(Function);

    const instance = dist.init({
      host: "arweave.net",
      protocol: "https",
      port: "443",
      logging: false,
    });

    expect(instance.api.constructor.name).toBe("Api");

    expect(instance.transactions.constructor.name).toBe("Transactions");

    expect(instance.wallets.constructor.name).toBe("Wallets");

    expect(instance.network.constructor.name).toBe("Network");

    expect(instance.crypto.constructor.name).toBe("WebCryptoDriver");

    expect(instance.silo.constructor.name).toBe("Silo");
  });

  it("should initialize from minified web bundle", async function () {
    require("../bundles/web.bundle.min");

    const dist = globals.self.Arweave;

    expect(dist).toBeInstanceOf(Function);

    expect(dist.init).toBeInstanceOf(Function);

    const instance = dist.init({
      host: "arweave.net",
      protocol: "https",
      port: "443",
      logging: false,
    });

    expect(instance).toBeInstanceOf(Object);
  });
});
