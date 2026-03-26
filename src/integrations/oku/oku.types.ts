// src/integrations/oku/oku.types.ts

import type { Address } from "../../domain/types";

export interface OkuPoolConfig {
  address: Address;
  name?: string;
}

export interface OkuPoolToken {
  address: Address;
  symbol: string;
  decimals: number;
}

export interface OkuPoolSnapshot {
  poolAddress: Address;
  factory: Address;
  token0: OkuPoolToken;
  token1: OkuPoolToken;
  fee: number;
  liquidity: bigint;
  sqrtPriceX96: bigint;
  tick: number;
}

export interface DiscoveredOkuPool {
  name: string;
  address: Address;
  factory: Address;
  token0: OkuPoolToken;
  token1: OkuPoolToken;
  fee: number;
  liquidity: bigint;
  sqrtPriceX96: bigint;
  tick: number;
  hasUsdc: boolean;
  usdcTokenAddress: Address | null;
}