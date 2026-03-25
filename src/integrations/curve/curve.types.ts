// src/integrations/curve/curve.types.ts

import type { Address } from "../../domain/types";

export interface CurvePoolConfig {
  address: Address;
  name: string;
}

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
  name: string;
  address: Address;
  coins: CurvePoolCoin[];
  balances: number[];
  hasUsdc: boolean;
  isTwoCoinPool: boolean;
  usdcCoinAddress: Address | null;
}