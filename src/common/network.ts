import type Api from "./lib/api";

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

export type PeerList = {} & string[];

export default class Network {
  private api: Api;

  constructor(api: Api) {
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
