import type { AxiosError, AxiosResponse } from "axios";
import type { ApiConfig, ApiRequestConfig } from "./api";
import Api from "./api";
import type { PeerList } from "../network";

type FallbackApiRequestConfig = {
  fallback?: {
    maxAttempts?: number;
    onFallback?: (err: AxiosError, host: Api) => Promise<void> | void;
    randomlySelect?: boolean;
  };
  gatewayOnly?: boolean;
} & ApiRequestConfig;

const isApiConfig = (o: URL | ApiConfig | string): o is ApiConfig => typeof o !== "string" && "url" in o;

const defaultFallbackConfig = {
  maxAttempts: 15,
  randomlySelect: true,
};

export class FallbackApi {
  public minerInstances: Api[] = [];
  public globalConfig: Omit<ApiConfig, "url">;
  public gatewayInstances: Api[] = [];

  constructor({
    gateways,
    miners,
    opts,
  }: {
    gateways?: ApiConfig[] | URL[] | string[];
    miners?: ApiConfig[] | URL[] | string[];
    opts?: { globalConfig?: Omit<ApiConfig, "url"> };
  }) {
    this.globalConfig = opts?.globalConfig ?? {};
    if (miners) this.addMiners(miners);
    if (gateways) this.addGateways(gateways);
    // this.gatewayInstance = this.minerInstances[0];
  }

  public async addPeersFrom(url: string | URL, options?: { limit?: number }): Promise<void> {
    const peers = (await this.get<PeerList>("", { url: new URL("/peers", url).toString() })).data;
    this.addMiners(peers.slice(0, options?.limit).map((p) => `http://${p}`));
  }

  public addMiners(hosts: (URL | string | ApiConfig)[]): void {
    hosts.forEach((h) => this.minerInstances.push(new Api(isApiConfig(h) ? (h as ApiConfig) : { url: new URL(h), ...this.globalConfig })));
  }

  public addGateways(hosts: (URL | string | ApiConfig)[]): void {
    hosts.forEach((h) => this.gatewayInstances.push(new Api(isApiConfig(h) ? (h as ApiConfig) : { url: new URL(h), ...this.globalConfig })));
  }

  public async get<T = any>(path: string, config?: FallbackApiRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>(path, { ...config, method: "GET" });
  }

  public async post<T = any>(path: string, body: Buffer | string | object | null, config?: FallbackApiRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>(path, { data: body, ...config, method: "POST" });
  }

  public async request<T = any>(path: string, config?: FallbackApiRequestConfig): Promise<AxiosResponse<T>> {
    const fallbackConfig = { ...defaultFallbackConfig, ...config?.fallback };
    let attempts = 0;
    const errors = [];
    const instances = config?.gatewayOnly ? this.gatewayInstances : this.gatewayInstances.concat(this.minerInstances);
    const maxAttempts = Math.min(Math.max(fallbackConfig?.maxAttempts, 1), instances.length);
    const onFallback = fallbackConfig?.onFallback;
    if (instances.length === 0) throw new Error(`Unable to run request due to 0 configured gateways/miners.`);
    while (attempts++ < maxAttempts) {
      const apiInstance = instances.at(fallbackConfig?.randomlySelect ? Math.floor(Math.random() * instances.length) : attempts - 1);
      if (!apiInstance) continue;
      try {
        return await apiInstance.request(path, { ...config });
      } catch (e: any) {
        onFallback?.(e, apiInstance);
        errors.push(e);
        if (attempts >= maxAttempts) throw e;
      }
    }

    throw new Error("unreachable");
  }
}
export default FallbackApi;
