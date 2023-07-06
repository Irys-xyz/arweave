import type { ApiConfig } from "./lib/api";

export type InitApiConfig = Omit<ApiConfig, "url"> & { url?: string | URL };
export type InitFallbackApiConfig = ApiConfig; /* & { fallbackToPeers?: boolean }; */
