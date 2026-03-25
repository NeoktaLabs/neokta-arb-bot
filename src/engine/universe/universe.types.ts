// src/engine/universe/universe.types.ts

export interface TrustedPool {
  address: string;
  name?: string;

  usdcSymbol: string;
  usdcIndex: number;
  usdcDecimals: number;

  token: string;
  tokenIndex: number;
  tokenDecimals: number;
}

export interface TokenCluster {
  token: string;
  pools: TrustedPool[];
}

export interface ArbCandidate {
  token: string;
  pools: TrustedPool[];
}