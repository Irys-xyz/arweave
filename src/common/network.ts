import type Api from "./lib/api";
import type FallbackApi from "./lib/fallbackApi";

export type NetworkInfoInterface = {
  network: string;
  version: number;
  release: number;
  height: number;
  current: string;
  blocks: number;
  peers: number;
  queue_length: number;
  node_state_latency: number;
};

export type PeerList = string[];

export default class Network {
  private api: Api | FallbackApi;

  constructor(api: Api | FallbackApi) {
    this.api = api;
  }

  public getInfo(): Promise<NetworkInfoInterface> {
    return this.api.get(`info`).then((response) => {
      return response.data;
    });
  }

  public getPeers(): Promise<PeerList> {
    return this.api.get(`peers`).then((response) => {
      return response.data;
    });
  }
}
