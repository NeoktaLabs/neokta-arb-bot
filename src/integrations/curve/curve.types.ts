// src/integrations/curve/curve.types.ts

export interface CurvePoolConfig {
  address: string;
  name: string;
}

export interface CurvePoolCoin {
  index: number;
  address: string;
  symbol: string;
  decimals: number;
}

export interface CurvePoolSnapshot {
  poolAddress: string;
  coins: CurvePoolCoin[];
  balances: number[];
}

export interface DiscoveredCurvePool {
  name: string;
  address: string;
  coins: CurvePoolCoin[];
  balances: number[];
  hasUsdc: boolean;
  isTwoCoinPool: boolean;
}