// src/engine/universe/universe.builder.ts

import type { DiscoveredCurvePool } from "../../integrations/curve/curve.types";
import type { ArbCandidate, TokenCluster, TrustedPool } from "./universe.types";

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

    const usdcCoin = pool.coins.find((coin) => coin.address === pool.usdcCoinAddress);
    const otherCoin = pool.coins.find((coin) => coin.address !== pool.usdcCoinAddress);

    if (!usdcCoin || !otherCoin) continue;

    trusted.push({
      address: pool.address,
      name: pool.name,

      usdcAddress: usdcCoin.address,
      usdcSymbol: usdcCoin.symbol,
      usdcIndex: usdcCoin.index,
      usdcDecimals: usdcCoin.decimals,

      tokenAddress: otherCoin.address,
      tokenSymbol: otherCoin.symbol,
      tokenIndex: otherCoin.index,
      tokenDecimals: otherCoin.decimals,
    });
  }

  return trusted;
}

export function buildTokenClusters(pools: TrustedPool[]): TokenCluster[] {
  const map = new Map<string, TrustedPool[]>();

  for (const pool of pools) {
    const key = pool.tokenAddress.toLowerCase();

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(pool);
  }

  return Array.from(map.entries()).map(([tokenAddress, groupedPools]) => ({
    tokenAddress: tokenAddress as `0x${string}`,
    tokenSymbol: groupedPools[0].tokenSymbol,
    pools: groupedPools,
  }));
}

export function findArbCandidates(clusters: TokenCluster[]): ArbCandidate[] {
  return clusters
    .filter((cluster) => cluster.pools.length >= 2)
    .map((cluster) => ({
      tokenAddress: cluster.tokenAddress,
      tokenSymbol: cluster.tokenSymbol,
      pools: cluster.pools,
    }));
}