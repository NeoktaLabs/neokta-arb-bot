// src/engine/universe/universe.builder.ts

import type { DiscoveredCurvePool } from "../../integrations/curve/curve.types";
import type { ArbCandidate, TokenCluster, TrustedPool } from "./universe.types";

function normalize(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function isUsdc(symbol: string): boolean {
  const s = normalize(symbol);
  return s === "USDC" || s === "USDCE" || s === "USDC.E";
}

function isHealthyPoolAddress(
  address: string,
  poolHealth: { address: string; status: string }[]
): boolean {
  const match = poolHealth.find(
    (item) => item.address.toLowerCase() === address.toLowerCase()
  );

  return match?.status === "healthy";
}

export function buildTrustedPools(
  discoveredPools: DiscoveredCurvePool[],
  poolHealth: { address: string; status: string }[]
): TrustedPool[] {
  const trusted: TrustedPool[] = [];

  for (const pool of discoveredPools) {
    if (!pool.hasUsdc) continue;
    if (!pool.isTwoCoinPool) continue;
    if (!isHealthyPoolAddress(pool.address, poolHealth)) continue;

    const usdcCoin = pool.coins.find((coin) => isUsdc(coin.symbol));
    const otherCoin = pool.coins.find((coin) => !isUsdc(coin.symbol));

    if (!usdcCoin || !otherCoin) continue;

    trusted.push({
      address: pool.address,
      name: pool.name,

      usdcSymbol: usdcCoin.symbol,
      usdcIndex: usdcCoin.index,
      usdcDecimals: usdcCoin.decimals,

      token: normalize(otherCoin.symbol),
      tokenIndex: otherCoin.index,
      tokenDecimals: otherCoin.decimals,
    });
  }

  return trusted;
}

export function buildTokenClusters(pools: TrustedPool[]): TokenCluster[] {
  const map = new Map<string, TrustedPool[]>();

  for (const pool of pools) {
    if (!map.has(pool.token)) {
      map.set(pool.token, []);
    }

    map.get(pool.token)!.push(pool);
  }

  return Array.from(map.entries()).map(([token, groupedPools]) => ({
    token,
    pools: groupedPools,
  }));
}

export function findArbCandidates(clusters: TokenCluster[]): ArbCandidate[] {
  return clusters.filter((cluster) => cluster.pools.length >= 2);
}