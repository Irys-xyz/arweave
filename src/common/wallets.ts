import type Api from "./lib/api";
import type CryptoInterface from "./lib/crypto/crypto-interface";
import type { JWKInterface } from "./lib/wallet";
import * as ArweaveUtils from "./lib/utils";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as _ from "arconnect";
import type FallbackApi from "./lib/fallbackApi";

export default class Wallets {
  private api: Api | FallbackApi;

  private crypto: CryptoInterface;

  constructor(api: Api | FallbackApi, crypto: CryptoInterface) {
    this.api = api;
    this.crypto = crypto;
  }

  /**
   * Get the wallet balance for the given address.
   *
   * @param {string} address - The arweave address to get the balance for.
   *
   * @returns {Promise<string>} - Promise which resolves with a winston string balance.
   */
  public getBalance(address: string): Promise<string> {
    return this.api
      .get(`wallet/${address}/balance`, {
        transformResponse: [
          /**
           * We need to specify a response transformer to override
           * the default JSON.parse behaviour, as this causes
           * balances to be converted to a number and we want to
           * return it as a winston string.
           * @param data
           */
          function (data): string {
            return data;
          },
        ],
      })
      .then((response) => {
        return response.data;
      });
  }

  /**
   * Get the last transaction ID for the given wallet address.
   *
   * @param {string} address - The arweave address to get the transaction for.
   *
   * @returns {Promise<string>} - Promise which resolves with a transaction ID.
   */
  public getLastTransactionID(address: string): Promise<string> {
    return this.api.get(`wallet/${address}/last_tx`).then((response) => {
      return response.data;
    });
  }

  public generate(): Promise<JWKInterface> {
    return this.crypto.generateJWK();
  }

  public async jwkToAddress(jwk?: JWKInterface | "use_wallet"): Promise<string> {
    if (!jwk || jwk === "use_wallet") {
      return this.getAddress();
    } else {
      return this.getAddress(jwk);
    }
  }

  public async getAddress(jwk?: JWKInterface | "use_wallet"): Promise<string> {
    if (!jwk || jwk === "use_wallet") {
      try {
        await arweaveWallet.connect(["ACCESS_ADDRESS"]);
      } catch {
        // Permission is already granted
      }

      return arweaveWallet.getActiveAddress();
    } else {
      return this.ownerToAddress(jwk.n);
    }
  }

  public async ownerToAddress(owner: string): Promise<string> {
    return ArweaveUtils.bufferTob64Url(await this.crypto.hash(ArweaveUtils.b64UrlToBuffer(owner)));
  }
}
