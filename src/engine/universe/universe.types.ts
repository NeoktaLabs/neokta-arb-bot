// src/engine/universe/universe.types.ts

import type { ChainId } from "../../domain/chains";
import type { Address } from "../../domain/types";

export interface TrustedPool {
  chainId: ChainId;
  address: Address;
  name?: string;

  usdcAddress: Address;
  usdcSymbol: string;
  usdcIndex: number;
  usdcDecimals: number;

  tokenAddress: Address;
  tokenSymbol: string;
  tokenIndex: number;
  tokenDecimals: number;
}

export interface TokenCluster {
  tokenAddress: Address;
  tokenSymbol: string;
  pools: TrustedPool[];
}

export interface ArbCandidate {
  tokenAddress: Address;
  tokenSymbol: string;
  pools: TrustedPool[];
}