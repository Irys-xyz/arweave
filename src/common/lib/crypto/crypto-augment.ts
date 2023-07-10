import type { DeepHash } from "../deepHash";
import { concatBuffers, stringToBuffer } from "../utils";
import type CryptoInterface from "./crypto-interface";
import type { Class } from "../../types";

export type AugmentedCrypto = {
  deepHash: DeepHash;
} & CryptoInterface;

export function augmentCrypto(
  crypto: CryptoInterface,
  augments: { deepHash: Class<DeepHash, ConstructorParameters<typeof DeepHash>> },
): AugmentedCrypto {
  const crypt = crypto as AugmentedCrypto;
  crypt.deepHash = new augments.deepHash({ deps: { utils: { stringToBuffer, concatBuffers }, crypto } });
  return crypt;
  //   crypto: Class<CryptoInterface>,
  //   augments: { deepHash: Class<DeepHash, ConstructorParameters<typeof DeepHash>> },
  // ): AugmentedCrypto {
  //   const cryptoAugment = class Crypto extends crypto implements CryptoInterface {
  //     public deepHash: DeepHash;
  //     constructor() {
  //       super();
  //       this.deepHash = new augments.deepHash({ deps: { crypto: this, utils: ArweaveUtils } });
  //     }
  //   };
  //   return new cryptoAugment();
}
