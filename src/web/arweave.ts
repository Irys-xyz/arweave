import _Arweave from "../common";
import type { ApiConfig } from "../common/lib/api";
import { getDefaultConfig } from "./net-config";

declare global {
  interface Window {
    Arweave: typeof _Arweave;
  }

  // eslint-disable-next-line no-var
  var Arweave: typeof _Arweave;
}

_Arweave.init = function (apiConfig: ApiConfig = {}): _Arweave {
  const defaults = {
    host: "arweave.net",
    port: 443,
    protocol: "https",
  };

  if (typeof location !== "object" ?? !location.protocol ?? !location.hostname) {
    return new _Arweave({
      ...apiConfig,
      ...defaults,
    });
  }

  // window.location.protocol has a trailing colon (http:, https:, file: etc)
  const locationProtocol = location.protocol.replace(":", "");
  const locationHost = location.hostname;
  const locationPort = location.port ? parseInt(location.port) : locationProtocol == "https" ? 443 : 80;

  const defaultConfig = getDefaultConfig(locationProtocol, locationHost);

  const protocol = apiConfig.protocol ?? defaultConfig.protocol;
  const host = apiConfig.host ?? defaultConfig.host;
  const port = apiConfig.port ?? defaultConfig.port ?? locationPort;

  return new _Arweave({
    ...apiConfig,
    host,
    protocol,
    port,
  });
};

if (typeof globalThis === "object") {
  globalThis.Arweave = _Arweave;
} else if (typeof self === "object") {
  self.Arweave = _Arweave;
}

export * from "../common";
export default _Arweave;
