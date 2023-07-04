import { ApiConfig } from "./lib/api";

export type InitApiConfig = Omit<ApiConfig, "url"> & { url?: string | URL };
