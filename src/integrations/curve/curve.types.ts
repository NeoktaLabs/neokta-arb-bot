// src/integrations/curve/curve.types.ts

import type { ChainId } from "../../domain/chains";
import type { Address } from "../../domain/types";

export interface CurvePoolCoin {
  index: number;
  address: Address;
  symbol: string;
  decimals: number;
}

export interface CurvePoolSnapshot {
  poolAddress: Address;
  coins: CurvePoolCoin[];
  balances: number[];
}

export interface DiscoveredCurvePool {
  chainId: ChainId;
  name: string;
  address: Address;
  coins: CurvePoolCoin[];
  balances: number[];
  hasUsdc: boolean;
  isTwoCoinPool: boolean;
  usdcCoinAddress: Address | null;
}