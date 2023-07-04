import BigNumber from "bignumber.js";

export function winstonToAr(winston: BigNumber.Value): BigNumber {
  return new BigNumber(winston).shiftedBy(-12);
}

export function arToWinston(ar: BigNumber.Value): BigNumber {
  return new BigNumber(ar).shiftedBy(12);
}
