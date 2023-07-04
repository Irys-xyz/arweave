// import { getDefaultConfig } from "../src/web/net-config";

describe("Net Config", function () {
  jest.setTimeout(2_000);
  it.todo("todo");
  // it.skip("should detect localhost dev environment", async function () {
  //   const file = getDefaultConfig("file", "");
  //   expect(file.protocol).toBe("https");
  //   expect(file.host).toBe("arweave.net");
  //   expect(file.port).toBe(443);
  //   const localhost = getDefaultConfig("http", "sub.fake.localhost");
  //   expect(localhost.protocol).toBe("https");
  //   expect(localhost.host).toBe("arweave.net");
  //   expect(localhost.port).toBe(443);
  //   const ipv4 = getDefaultConfig("http", "127.0.0.255");
  //   expect(ipv4.protocol).toBe("https");
  //   expect(ipv4.host).toBe("arweave.net");
  //   expect(ipv4.port).toBe(443);
  //   const ipv6 = getDefaultConfig("http", "[::1]");
  //   expect(ipv6.protocol).toBe("https");
  //   expect(ipv6.host).toBe("arweave.net");
  //   expect(ipv6.port).toBe(443);
  // });

  // it.skip("should remove first subdomain when appropriate", async () => {
  //   const subdomain = getDefaultConfig("https", "arnsname.example.com");
  //   expect(subdomain.protocol).toBe("https");
  //   expect(subdomain.host).toBe("example.com");
  //   expect(subdomain.port).toBeUndefined();
  //   const generated = getDefaultConfig("https", "ngnrj2ntoigcuduz2xwowwzaxojwinwb7qugblukljxkhrymozaq.example.com");
  //   expect(generated.protocol).toBe("https");
  //   expect(generated.host).toBe("example.com");
  //   expect(generated.port).toBeUndefined();
  // });

  // it.skip("should let ip addresses pass through", async () => {
  //   const ipv4 = getDefaultConfig("https", "123.123.123.123");
  //   expect(ipv4.protocol).toBe("https");
  //   expect(ipv4.host).toBe("123.123.123.123");
  //   expect(ipv4.port).toBeUndefined();
  //   const ipv6 = getDefaultConfig("https", "[2001:db8:3333:4444:5555:6666:7777:8888]");
  //   expect(ipv6.protocol).toBe("https");
  //   expect(ipv6.host).toBe("[2001:db8:3333:4444:5555:6666:7777:8888]");
  //   expect(ipv6.port).toBeUndefined();
  // });
});
