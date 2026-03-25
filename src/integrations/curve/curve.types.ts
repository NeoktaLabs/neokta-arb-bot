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
}

export interface DiscoveredCurvePool {
  name: string;
  address: string;
  coins: CurvePoolCoin[];
  hasUsdc: boolean;
  isTwoCoinPool: boolean;
}