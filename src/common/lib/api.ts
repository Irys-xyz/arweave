import type { AxiosResponse, AxiosRequestConfig, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import Axios from "axios";
import AsyncRetry from "async-retry";
import Arweave from "../arweave";

export interface ApiConfig {
  url: URL | string;
  timeout?: number;
  logging?: boolean;
  logger?: (msg: string) => void;
  network?: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  retry?: AsyncRetry.Options;
}

export type ApiRequestConfig = {
  retry?: AsyncRetry.Options;
} & AxiosRequestConfig;

export default class Api {
  protected _instance?: AxiosInstance;
  public cookieMap = new Map();

  public config!: ApiConfig;

  constructor(config?: ApiConfig) {
    if (config) this.applyConfig(config);
  }

  public applyConfig(config: ApiConfig): void {
    this.config = this.mergeDefaults(config);
    this._instance = undefined;
  }

  public getConfig(): ApiConfig {
    return this.config;
  }

  private async requestInterceptor(request: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    const cookies = this.cookieMap.get(new URL(request.baseURL ?? "").host);
    if (cookies) request.headers!.cookie = cookies;
    return request;
  }

  private async responseInterceptor(response: AxiosResponse): Promise<AxiosResponse> {
    const setCookie = response.headers?.["set-cookie"];
    if (setCookie) this.cookieMap.set(response.request.host, setCookie);
    return response;
  }

  private mergeDefaults(config: ApiConfig): ApiConfig {
    config.headers ??= {};
    if (config.network && !Object.keys(config.headers).includes("x-network")) config.headers["x-network"] = config.network;
    return {
      url: config.url,
      timeout: config.timeout ?? 20000,
      logging: config.logging ?? false,
      logger: config.logger ?? console.log,
      headers: { ...config.headers, "x-irys-arweave-version": Arweave.VERSION },
      withCredentials: config.withCredentials ?? false,
      retry: { retries: 3, maxTimeout: 5_000 },
    };
  }

  public async get<T = any>(path: string, config?: ApiRequestConfig): Promise<AxiosResponse<T>> {
    try {
      return await this.request(path, { ...config, method: "GET" });
    } catch (error: any) {
      if (error.response?.status) return error.response;
      throw error;
    }
  }

  public async post<T = any>(path: string, body: Buffer | string | object | null, config?: ApiRequestConfig): Promise<AxiosResponse<T>> {
    try {
      return await this.request(path, { data: body, ...config, method: "POST" });
    } catch (error: any) {
      if (error.response?.status) return error.response;
      throw error;
    }
  }

  public get instance(): AxiosInstance {
    if (this._instance) return this._instance;

    const instance = Axios.create({
      baseURL: this.config.url.toString(),
      timeout: this.config.timeout,
      maxContentLength: 1024 * 1024 * 512,
      headers: this.config.headers,
      withCredentials: this.config.withCredentials,
    });

    if (this.config.withCredentials) {
      instance.interceptors.request.use(this.requestInterceptor.bind(this));
      instance.interceptors.response.use(this.responseInterceptor.bind(this));
    }

    if (this.config.logging) {
      instance.interceptors.request.use((request) => {
        this.config.logger!(`Requesting: ${request.baseURL}/${request.url}`);
        return request;
      });

      instance.interceptors.response.use((response) => {
        this.config.logger!(`Response: ${response.config.url} - ${response.status}`);
        return response;
      });
    }

    return (this._instance = instance);
  }

  public async request<T = any>(path: string, config?: ApiRequestConfig): Promise<AxiosResponse<T>> {
    const instance = this.instance;
    const url = config?.url ?? new URL(path, this.config.url).toString();
    return AsyncRetry((_) => instance({ ...config, url }), {
      ...this.config.retry,
      ...config?.retry,
    });
  }
}
