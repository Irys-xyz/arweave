// import Ar from "./ar";
import Blocks from "./blocks";
import Chunks from "./chunks";
import type { ApiConfig } from "./lib/api";
import type { AugmentedCrypto } from "./lib/crypto/crypto-augment";
import { augmentCrypto } from "./lib/crypto/crypto-augment";
import type CryptoInterface from "./lib/crypto/crypto-interface";
import { DeepHash } from "./lib/deepHash";
import FallbackApi from "./lib/fallbackApi";
import Merkle from "./lib/merkle";
import { Stream } from "./lib/stream";
import type { Tag, TransactionInterface } from "./lib/transaction";
import Transaction from "./lib/transaction";
import * as ArweaveUtils from "./lib/utils";
import type { JWKInterface } from "./lib/wallet";
import Network from "./network";
import Transactions from "./transactions";
import Wallets from "./wallets";

export type CreateTransactionInterface = {
  format: number;
  last_tx: string;
  owner: string;
  tags: Tag[];
  target: string;
  quantity: string;
  data: string | Uint8Array | ArrayBuffer;
  data_size: string;
  data_root: string;
  reward: string;
};

export type AbstractConfig = {
  gateways?: URL | string | ApiConfig | ApiConfig[] | string[] | URL[];
  crypto?: CryptoInterface;
  miners?: ApiConfig[] | string[] | URL[];
};

export abstract class Arweave {
  protected config: AbstractConfig;
  public api: FallbackApi;

  public wallets: Wallets;

  public transactions: Transactions;

  public network: Network;

  public blocks: Blocks;

  public chunks: Chunks;

  public static init: (apiConfig: ApiConfig) => Arweave;

  public static utils = ArweaveUtils;
  public stream: Stream;

  public crypto: AugmentedCrypto;

  protected deepHash: DeepHash;
  public merkle: Merkle;

  public static VERSION = "REPLACEMEARWEAVEVERSION";

  constructor(config: AbstractConfig) {
    this.config = config;
    if (!config.crypto) throw new Error(`config.crypto is required`); // `crypto` is automatically added by the wrapper constructors, users should never encounter this
    this.crypto = augmentCrypto(config.crypto, { deepHash: DeepHash });
    this.deepHash = this.crypto.deepHash;
    const apiConfig = config.gateways ? (Array.isArray(config.gateways) ? config.gateways : [config.gateways as ApiConfig]) : undefined;
    this.api = new FallbackApi({ gateways: apiConfig, miners: config.miners });
    this.wallets = new Wallets(this.api, this.crypto);
    this.chunks = new Chunks(this.api);
    this.network = new Network(this.api);
    this.blocks = new Blocks(this.api, this.network);
    this.merkle = new Merkle({ deps: { crypto: this.crypto } });

    this.transactions = new Transactions({
      deps: { api: this.api, crypto: config.crypto, chunks: this.chunks, merkle: this.merkle, deepHash: this.deepHash },
    });
    this.stream = new Stream({
      deps: { crypto: this.crypto, api: this.api, merkle: this.merkle, transactions: this.transactions, deepHash: this.deepHash },
    });
  }

  public get utils(): typeof ArweaveUtils {
    return Arweave.utils;
  }

  public getConfig(): AbstractConfig {
    return this.config;
  }

  public async createTransaction(attributes: Partial<CreateTransactionInterface>, jwk?: JWKInterface | "use_wallet"): Promise<Transaction> {
    const transaction: Partial<CreateTransactionInterface> = {};

    Object.assign(transaction, attributes);

    if (!attributes.data && !(attributes.target && attributes.quantity)) {
      throw new Error(`A new Arweave transaction must have a 'data' value, or 'target' and 'quantity' values.`);
    }

    if (attributes.owner == undefined) {
      if (jwk && jwk !== "use_wallet") {
        transaction.owner = jwk.n;
      }
    }

    if (attributes.last_tx == undefined) {
      transaction.last_tx = await this.transactions.getTransactionAnchor();
    }

    if (typeof attributes.data === "string") {
      attributes.data = ArweaveUtils.stringToBuffer(attributes.data);
    }

    if (attributes.data instanceof ArrayBuffer) {
      attributes.data = new Uint8Array(attributes.data);
    }

    if (attributes.data && !(attributes.data instanceof Uint8Array)) {
      throw new Error("Expected data to be a string, Uint8Array or ArrayBuffer");
    }

    if (attributes.reward == undefined) {
      const length = attributes.data ? attributes.data.byteLength : 0;
      transaction.reward = await this.transactions.getPrice(length, transaction.target);
    }

    // here we should call prepare chunk
    transaction.data_root = "";
    transaction.data_size = attributes.data ? attributes.data.byteLength.toString() : "0";
    transaction.data = attributes.data || new Uint8Array(0);

    const createdTransaction = new Transaction({
      attributes: transaction as TransactionInterface,
      deps: { merkle: this.merkle, deepHash: this.deepHash },
    });
    await createdTransaction.getSignatureData();
    return createdTransaction;
  }
}

export default Arweave;
