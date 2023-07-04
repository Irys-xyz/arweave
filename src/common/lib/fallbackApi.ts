import type { AxiosError, AxiosResponse } from "axios";
import type { ApiConfig, ApiRequestConfig } from "./api";
import Api from "./api";

type FallbackApiRequestConfig = {
  fallback?: {
    maxAttempts?: number;
    onFallback?: (err: AxiosError, host: Api) => Promise<void> | void;
    randomlySelect?: boolean;
  };
} & ApiRequestConfig;

const isApiConfig = (o: URL | ApiConfig): o is ApiConfig => Object.hasOwn(o, "url");

const defaultFallbackConfig = {
  maxAttempts: 5,
  randomlySelect: false,
};

// TODO: test

export class FallbackApi {
  protected instances!: Api[];

  constructor(hosts: ApiConfig[] | URL[]) {
    this.hosts = hosts;
  }

  set hosts(hosts: ApiConfig[] | URL[]) {
    this.instances = hosts.map((v) => new Api(isApiConfig(v) ? (v as ApiConfig) : { url: v }));
  }

  get hosts(): Api[] {
    return this.instances;
  }

  public async get<T = any>(endpoint: string, config?: FallbackApiRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "POST" });
  }

  public async post<T = any>(endpoint: string, body: Buffer | string | object | null, config?: FallbackApiRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>(endpoint, { data: body, ...config, method: "POST" });
  }

  public async request<T = any>(endpoint: string, config?: FallbackApiRequestConfig): Promise<AxiosResponse<T>> {
    const fallbackConfig = config?.fallback;
    let attempts = 0;
    const maxAttempts = Math.min(fallbackConfig?.maxAttempts ?? defaultFallbackConfig?.maxAttempts, this.instances.length);
    const onFallback = fallbackConfig?.onFallback;
    do {
      const config = this.instances.at(fallbackConfig?.randomlySelect ? Math.floor(Math.random() * this.instances.length) : attempts);
      if (!config) continue;
      try {
        const instance = config.instance;
        return await instance({ ...config, url: new URL(endpoint, config.config.url).toString() });
      } catch (e: any) {
        onFallback?.(e, config);
      }
    } while (attempts++ < maxAttempts);
    // make TS happy
    return await this.instances[0].instance({ ...config, url: new URL(endpoint, this.instances[0].config.url).toString() });
  }

  public identity = "FallbackApi";
}
export default FallbackApi;
