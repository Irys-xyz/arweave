// // import Axios, { AxiosResponse, AxiosRequestConfig, AxiosInstance } from "axios";

// import type { Anything } from "./types";

// // export interface ApiConfig {
// //   host?: string;
// //   protocol?: string;
// //   port?: string | number;
// //   timeout?: number;
// //   logging?: boolean;
// //   logger?: Function;
// //   network?: string;
// // }

// // export default class Api {
// //   public readonly METHOD_GET = "GET";
// //   public readonly METHOD_POST = "POST";

// //   public config!: ApiConfig;

// //   constructor(config: ApiConfig) {
// //     this.applyConfig(config);
// //   }

// //   public applyConfig(config: ApiConfig) {
// //     this.config = this.mergeDefaults(config);
// //   }

// //   public getConfig() {
// //     return this.config;
// //   }

// //   private mergeDefaults(config: ApiConfig): ApiConfig {
// //     const protocol = config.protocol || "http";
// //     const port = config.port || (protocol === "https" ? 443 : 80);

// //     return {
// //       host: config.host || "127.0.0.1",
// //       protocol,
// //       port,
// //       timeout: config.timeout || 20000,
// //       logging: config.logging || false,
// //       logger: config.logger || console.log,
// //       network: config.network,
// //     };
// //   }

// //   public async get<T = any>(
// //     endpoint: string,
// //     config?: AxiosRequestConfig
// //   ): Promise<AxiosResponse<T>> {
// //     try {
// //       return await this.request().get<T>(endpoint, config);
// //     } catch (error: any) {
// //       if (error.response && error.response.status) {
// //         return error.response;
// //       }

// //       throw error;
// //     }
// //   }

// //   public async post<T = any>(
// //     endpoint: string,
// //     body: Buffer | string | object,
// //     config?: AxiosRequestConfig
// //   ): Promise<AxiosResponse<T>> {
// //     try {
// //       return await this.request().post(endpoint, body, config);
// //     } catch (error: any) {
// //       if (error.response && error.response.status) {
// //         return error.response;
// //       }

// //       throw error;
// //     }
// //   }

// //   /**
// //    * Get an AxiosInstance with the base configuration setup to fire off
// //    * a request to the network.
// //    */
// //   public request(): AxiosInstance {
// //     const headers: any = {};
// //     if (this.config.network) {
// //       headers["x-network"] = this.config.network;
// //     }
// //     let instance = Axios.create({
// //       baseURL: `${this.config.protocol}://${this.config.host}:${this.config.port}`,
// //       timeout: this.config.timeout,
// //       maxContentLength: 1024 * 1024 * 512,
// //       headers,
// //     });

// //     if (this.config.logging) {
// //       instance.interceptors.request.use((request) => {
// //         this.config.logger!(`Requesting: ${request.baseURL}/${request.url}`);
// //         return request;
// //       });

// //       instance.interceptors.response.use((response) => {
// //         this.config.logger!(
// //           `Response:   ${response.config.url} - ${response.status}`
// //         );
// //         return response;
// //       });
// //     }

// //     return instance;
// //   }
// // }

// export type ApiConfig = {
//   host?: string;
//   protocol?: string;
//   port?: string | number;
//   timeout?: number;
//   logging?: boolean;
//   logger?: (log: string) => Promise<Anything> | Anything;
//   network?: string;
// };

// export type ResponseWithData<T = any> = {
//   data: T;
// } & Response;

// export type RequestInitWithAxios = {
//   responseType?: "arraybuffer" | "json" | "text" | "webstream";
// } & RequestInit;

// export default class Api {
//   public readonly METHOD_GET = "GET";
//   public readonly METHOD_POST = "POST";

//   public config!: ApiConfig;

//   constructor(config: ApiConfig) {
//     this.applyConfig(config);
//   }

//   public applyConfig(config: ApiConfig) {
//     this.config = this.mergeDefaults(config);
//   }

//   public getConfig() {
//     return this.config;
//   }

//   private mergeDefaults(config: ApiConfig): ApiConfig {
//     const protocol = config.protocol || "http";
//     const port = config.port || (protocol === "https" ? 443 : 80);

//     return {
//       host: config.host || "127.0.0.1",
//       protocol,
//       port,
//       timeout: config.timeout || 20000,
//       logging: config.logging || false,
//       logger: config.logger || console.log,
//       network: config.network,
//     };
//   }

//   public async get<T = any>(endpoint: string, config?: RequestInitWithAxios): Promise<ResponseWithData<T>> {
//     return await this.request(endpoint, { ...config, method: this.METHOD_GET });
//   }

//   public async post<T = any>(endpoint: string, body: any, config?: RequestInitWithAxios): Promise<ResponseWithData<T>> {
//     const headers = new Headers(config?.headers || {});

//     if (!headers.get("content-type")?.includes("application/json")) {
//       headers.append("content-type", "application/json");
//     }
//     headers.append("accept", "application/json, text/plain, */*");

//     return await this.request(endpoint, {
//       ...config,
//       method: this.METHOD_POST,
//       body: typeof body !== "string" ? JSON.stringify(body) : body,
//       headers,
//     });
//   }

//   public async request<T = unknown>(endpoint: string, init?: RequestInitWithAxios): Promise<ResponseWithData<T>> {
//     const headers = new Headers(init?.headers || {});
//     const baseURL = `${this.config.protocol}://${this.config.host}:${this.config.port}`;

//     /* responseType is purely for backwards compatibility with external apps */
//     const responseType = init?.responseType;
//     delete init?.responseType;

//     if (endpoint.startsWith("/")) {
//       endpoint = endpoint.slice(1);
//     }

//     if (this.config.network) {
//       headers.append("x-network", this.config.network);
//     }

//     if (this.config.logging) {
//       this.config.logger!(`Requesting: ${baseURL}/${endpoint}`);
//     }

//     const res = await fetch(`${baseURL}/${endpoint}`, {
//       ...(init ?? {}),
//       headers,
//     });

//     if (this.config.logging) {
//       this.config.logger!(`Response:   ${res.url} - ${res.status}`);
//     }

//     const contentType = res.headers.get("content-type");
//     const charset = contentType?.match(/charset=([^()<>@,;:\"/[\]?.=\s]*)/i)?.[1];
//     const response: Partial<ResponseWithData<T>> = res;

//     const decodeText = async () => {
//       if (charset) {
//         try {
//           response.data = new TextDecoder(charset).decode(await res.arrayBuffer()) as T;
//         } catch (e) {
//           response.data = (await res.text()) as T;
//         }
//       } else {
//         response.data = (await res.text()) as T;
//       }
//     };

//     if (responseType === "arraybuffer") {
//       response.data = (await res.arrayBuffer()) as T;
//     } else if (responseType === "text") {
//       await decodeText();
//     } else if (responseType === "webstream") {
//       response.data = addAsyncIterator(res.body as ReadableStream) as T;
//     } else {
//       /** axios defaults to JSON, and then text, we mimic the behaviour */
//       try {
//         let test = await res.clone().json();
//         if (typeof test !== "object") {
//           await decodeText();
//         } else {
//           response.data = (await res.json()) as T;
//         }
//         test = null;
//       } catch {
//         await decodeText();
//       }
//     }

//     return response as ResponseWithData<T>;
//   }
// }

/**
 * *** To be removed when browsers catch up with the whatwg standard. ***
 * [Symbol.AsyncIterator] is needed to use `for-await` on the returned ReadableStream (web stream).
 * Feature is available in nodejs, and should be available in browsers eventually.
 */
export const addAsyncIterator = (body: ReadableStream): ReadableStream => {
  const bodyWithIter = body as ReadableStream<Uint8Array> & AsyncIterable<Uint8Array>;
  if (typeof bodyWithIter[Symbol.asyncIterator] === "undefined") {
    bodyWithIter[Symbol.asyncIterator] = webIiterator<Uint8Array>(body);
    return bodyWithIter;
  }
  return body;
};

const webIiterator = function <T>(stream: ReadableStream): () => AsyncGenerator<Awaited<T>, void> {
  return async function* iteratorGenerator<T>() {
    const reader = stream.getReader(); // lock
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value as T;
      }
    } finally {
      reader.releaseLock(); // unlock
    }
  };
};

import type { AxiosResponse, AxiosRequestConfig, AxiosInstance } from "axios";
import Axios from "axios";

export type ApiConfig = {
  host?: string;
  protocol?: string;
  port?: string | number;
  timeout?: number;
  logging?: boolean;
  logger?: (msg: string) => void;
  network?: string;
};

export default class Api {
  public readonly METHOD_GET = "GET";
  public readonly METHOD_POST = "POST";

  public config!: ApiConfig;

  constructor(config: ApiConfig) {
    this.applyConfig(config);
  }

  public applyConfig(config: ApiConfig): void {
    this.config = this.mergeDefaults(config);
  }

  public getConfig(): ApiConfig {
    return this.config;
  }

  private mergeDefaults(config: ApiConfig): ApiConfig {
    const protocol = config.protocol ?? "http";
    const port = config.port ?? (protocol === "https" ? 443 : 80);

    return {
      host: config.host ?? "127.0.0.1",
      protocol,
      port,
      timeout: config.timeout ?? 20000,
      logging: config.logging ?? false,
      logger: config.logger ?? console.log,
      network: config.network,
    };
  }

  public async get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      return await this.request().get<T>(endpoint, config);
    } catch (error: any) {
      if (error.response && error.response.status) {
        return error.response;
      }

      throw error;
    }
  }

  public async post<T = any>(endpoint: string, body: Buffer | string | object, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      return await this.request().post(endpoint, body, config);
    } catch (error: any) {
      if (error.response && error.response.status) {
        return error.response;
      }

      throw error;
    }
  }

  /**
   * Get an AxiosInstance with the base configuration setup to fire off
   * a request to the network.
   */
  public request(): AxiosInstance {
    const headers: any = {};
    if (this.config.network) {
      headers["x-network"] = this.config.network;
    }
    const instance = Axios.create({
      baseURL: `${this.config.protocol}://${this.config.host}:${this.config.port}`,
      timeout: this.config.timeout,
      maxContentLength: 1024 * 1024 * 512,
      headers,
    });

    if (this.config.logging) {
      instance.interceptors.request.use((request) => {
        this.config.logger!(`Requesting: ${request.baseURL}/${request.url}`);
        return request;
      });

      instance.interceptors.response.use((response) => {
        this.config.logger!(`Response:   ${response.config.url} - ${response.status}`);
        return response;
      });
    }

    return instance;
  }
}
