// src/integrations/uniswap/uniswap.types.ts

import type { Address } from "../../domain/types";

export interface UniswapPoolSeed {
  token0: Address;
  token1: Address;
  fee: number;
  name: string;
}

export interface UniswapPoolToken {
  address: Address;
  symbol: string;
  decimals: number;
}

export interface UniswapPoolSnapshot {
  poolAddress: Address;
  token0: UniswapPoolToken;
  token1: UniswapPoolToken;
  fee: number;
  liquidity: bigint;
  sqrtPriceX96: bigint;
  tick: number;
}

export interface DiscoveredUniswapPool {
  name: string;
  address: Address;
  token0: UniswapPoolToken;
  token1: UniswapPoolToken;
  fee: number;
  liquidity: bigint;
  sqrtPriceX96: bigint;
  tick: number;
  hasUsdc: boolean;
  usdcTokenAddress: Address | null;
}
