// src/engine/universe/universe.types.ts

export interface TrustedPool {
  address: string;
  name?: string;
  token: string; // non-USDC token
}

export interface TokenCluster {
  token: string;
  pools: TrustedPool[];
}

export interface ArbCandidate {
  token: string;
  pools: TrustedPool[];
}