import type { AxiosError, AxiosResponse } from "axios";
import type { ApiConfig, ApiRequestConfig } from "./api";
import Api from "./api";
import type { PeerList } from "common/network";

type FallbackApiRequestConfig = {
  fallback?: {
    maxAttempts?: number;
    onFallback?: (err: AxiosError, host: Api) => Promise<void> | void;
    randomlySelect?: boolean;
  };
} & ApiRequestConfig;

const isApiConfig = (o: URL | ApiConfig | string): o is ApiConfig => typeof o !== "string" && "url" in o;

const defaultFallbackConfig = {
  maxAttempts: 15,
  randomlySelect: true,
};

// TODO: test

export class FallbackApi {
  public instances: Api[] = [];
  public globalConfig: Omit<ApiConfig, "url">;

  constructor(hosts?: ApiConfig[] | URL[] | string[], opts?: { globalConfig?: Omit<ApiConfig, "url"> }) {
    this.globalConfig = opts?.globalConfig ?? {};
    if (hosts) this.addHosts(hosts);
  }

  public async addPeersFrom(url: string | URL, options?: { limit?: number }): Promise<void> {
    const peers = (await this.get<PeerList>("", { url: new URL("/peers", url).toString() })).data;
    this.addHosts(peers.slice(0, options?.limit).map((p) => `http://${p}`));
  }

  public addHosts(hosts: (URL | string | ApiConfig)[]): void {
    hosts.forEach((h) => this.instances.push(new Api(isApiConfig(h) ? (h as ApiConfig) : { url: new URL(h), ...this.globalConfig })));
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
    const maxAttempts = Math.min(Math.max(fallbackConfig?.maxAttempts, 1), this.instances.length);
    const onFallback = fallbackConfig?.onFallback;
    if (this.instances.length === 0) throw new Error(`Unable to run request due to 0 configured URLs.`);
    while (attempts++ < maxAttempts) {
      const apiInstance = this.instances.at(fallbackConfig?.randomlySelect ? Math.floor(Math.random() * this.instances.length) : attempts - 1);
      if (!apiInstance) continue;
      try {
        return await apiInstance.request(path, { ...config });
      } catch (e: any) {
        onFallback?.(e, apiInstance);
        if (attempts >= maxAttempts) throw e;
      }
    }

    throw new Error("unreachable");
  }
}
export default FallbackApi;
