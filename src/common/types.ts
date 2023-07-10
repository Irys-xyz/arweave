import type { ApiConfig } from "./lib/api";

export type InitFallbackApiConfig = ApiConfig; /* & { fallbackToPeers?: boolean }; */
export type Class<I, Args extends any[] = any[]> = new (...args: Args) => I;

/** "formal" any, used when we mean it and *not* as a placeholder */
export type Anything = any;
