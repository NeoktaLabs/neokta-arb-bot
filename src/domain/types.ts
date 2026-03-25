// src/domain/types.ts

export interface Env {
  ETHERLINK_RPC_URL?: string;
  INITIAL_USDC: string;
  MIN_PROFIT_USD: string;
}

export type TokenSymbol = string;

export interface Token {
  symbol: TokenSymbol;
  address: string;
  decimals: number;
}

export interface Pool {
  address: string;
  tokens: Token[];
}

export interface SwapStep {
  poolAddress: string;
  fromToken: Token;
  toToken: Token;
  amountIn: number;
  amountOut: number;
}

export interface Path {
  steps: SwapStep[];
}

export interface PathResult {
  initialAmount: number;
  finalAmount: number;
  pnlUsd: number;
  pnlPct: number;
  steps: SwapStep[];
}