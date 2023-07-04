import type FallbackApi from "./fallbackApi";
import type _Api from "./api";
/** "formal" any, used when we mean it and *not* as a placeholder */
export type Anything = any;

export type Api = _Api | FallbackApi;
