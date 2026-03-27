// src/domain/types.ts

import type { ChainId } from "./chains";

export type Address = `0x${string}`;

export interface Env {
  ETHERLINK_RPC_URL?: string;
  ETHEREUM_RPC_URL?: string;
  ENABLE_ETHEREUM?: string;
  INITIAL_USDC?: string;
  MIN_PROFIT_USD?: string;
  MIN_ALERT_PROFIT_USD?: string;
  MIN_CONFIDENT_PROFIT_USD?: string;
  USDC_ADDRESS?: string;
  ETHEREUM_USDC_ADDRESS?: string;

  ENABLE_OKU?: string;
  OKU_QUOTER_V2_ADDRESS?: string;

  ENABLE_UNISWAP?: string;
  ETHEREUM_UNISWAP_FACTORY_ADDRESS?: string;
  ETHEREUM_UNISWAP_QUOTER_V2_ADDRESS?: string;

  ENABLE_TELEGRAM_ALERTS?: string;
  ENABLE_NEAR_MISS_ALERTS?: string;
  ENABLE_IMBALANCE_ALERTS?: string;

  NEAR_MISS_MIN_PNL_USD?: string;
  IMBALANCE_ALERT_THRESHOLD_PCT?: string;
  MAX_ALERTS_PER_SCAN?: string;

  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;

  LADDER_SIZES?: string;

  RPC_MAX_CONCURRENCY?: string;
  RPC_MIN_INTERVAL_MS?: string;
  RPC_MAX_RETRIES?: string;
  RPC_BASE_BACKOFF_MS?: string;
  RPC_MAX_BACKOFF_MS?: string;
  RPC_JITTER_MS?: string;

  SCAN_LOCK?: DurableObjectNamespace;
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

export interface ChainSelection {
  chainId: ChainId;
}
