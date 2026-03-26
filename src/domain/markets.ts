// src/domain/markets.ts

import type { ChainId } from "./chains";
import type { Address } from "./types";

export type VenueId = "curve" | "oku" | "uniswap";

export interface MarketToken {
  address: Address;
  symbol: string;
  decimals: number;
  index?: number;
}

export interface MarketPool {
  chainId: ChainId;
  venue: VenueId;
  address: Address;
  name: string;
  tokens: [MarketToken, MarketToken];
  hasUsdc: boolean;
  usdcTokenAddress: Address | null;
  fee?: number;
  metadata?: Record<string, unknown>;
}
