// src/engine/universe/universe.builder.ts

import type { ArbCandidate, TokenCluster, TrustedPool } from "./universe.types";

function normalize(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function isUsdc(symbol: string): boolean {
  const s = normalize(symbol);
  return s === "USDC" || s === "USDCE" || s === "USDC.E";
}

export function buildTrustedPools(results: any[]): TrustedPool[] {
  const pools: TrustedPool[] = [];

  for (const result of results) {
    if (result.health !== "healthy") continue;
    if (!Array.isArray(result.legs) || result.legs.length === 0) continue;

    const leg = result.legs[0];

    const tokenA = normalize(leg.fromSymbol);
    const tokenB = normalize(leg.toSymbol);

    const nonUsdcToken = isUsdc(tokenA) ? tokenB : tokenA;

    pools.push({
      address: leg.poolAddress,
      name: leg.pool,
      token: nonUsdcToken,
    });
  }

  return pools;
}

export function buildTokenClusters(pools: TrustedPool[]): TokenCluster[] {
  const map = new Map<string, TrustedPool[]>();

  for (const pool of pools) {
    if (!map.has(pool.token)) {
      map.set(pool.token, []);
    }

    map.get(pool.token)!.push(pool);
  }

  return Array.from(map.entries()).map(([token, pools]) => ({
    token,
    pools,
  }));
}

export function findArbCandidates(clusters: TokenCluster[]): ArbCandidate[] {
  return clusters.filter((cluster) => cluster.pools.length >= 2);
}