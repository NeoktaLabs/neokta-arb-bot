// src/domain/types.ts

export type Address = `0x${string}`;

export interface Env {
  ETHERLINK_RPC_URL?: string;
  INITIAL_USDC?: string;
  MIN_PROFIT_USD?: string;
  USDC_ADDRESS?: string;
}

export type TokenSymbol = string;

export interface Token {
  symbol: TokenSymbol;
  address: Address;
  decimals: number;
}

export interface Pool {
  address: Address;
  tokens: Token[];
}

export interface SwapStep {
  poolAddress: Address;
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