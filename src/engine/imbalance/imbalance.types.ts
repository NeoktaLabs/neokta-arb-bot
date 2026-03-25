// src/engine/imbalance/imbalance.types.ts

export interface DirectionalQuotePoint {
  size: number;
  amountOut: number | null;
  error?: string;
}

export interface DirectionalQuoteSummary {
  fromSymbol: string;
  toSymbol: string;
  sizes: DirectionalQuotePoint[];
}

export interface PoolImbalanceReport {
  poolAddress: string;
  poolName: string;

  token0Symbol: string;
  token1Symbol: string;

  token0Balance: number;
  token1Balance: number;

  token0SharePct: number;
  token1SharePct: number;

  imbalancePct: number;
  classification: "balanced" | "imbalanced" | "extreme";

  directionalQuotes: {
    token0ToToken1: DirectionalQuoteSummary;
    token1ToToken0: DirectionalQuoteSummary;
  };
}