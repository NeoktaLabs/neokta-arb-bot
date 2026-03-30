// src/engine/opportunities/opportunity.builder.ts

import type { Address } from "../../domain/types";
import type { DiscoveredCurvePool } from "../../integrations/curve/curve.types";
import type { PoolImbalanceReport } from "../imbalance/imbalance.types";
import type { GeneratedPath, PathLeg } from "../paths/path.types";
import type { OpportunityCandidate } from "./opportunity.types";

function findPoolByAddress(
  pools: DiscoveredCurvePool[],
  poolAddress: string
): DiscoveredCurvePool | undefined {
  return pools.find((pool) => pool.address.toLowerCase() === poolAddress.toLowerCase());
}

function findUsdcPoolsForToken(
  pools: DiscoveredCurvePool[],
  tokenAddress: string
): DiscoveredCurvePool[] {
  return pools.filter((pool) => {
    if (!pool.isTwoCoinPool) return false;
    if (!pool.hasUsdc) return false;

    return pool.coins.some(
      (coin) => coin.address.toLowerCase() === tokenAddress.toLowerCase()
    );
  });
}

function buildUsdcToTokenLeg(pool: DiscoveredCurvePool, tokenAddress: string): PathLeg {
  const usdcCoin = pool.coins.find((coin) => coin.address === pool.usdcCoinAddress);
  const targetCoin = pool.coins.find(
    (coin) => coin.address.toLowerCase() === tokenAddress.toLowerCase()
  );

  if (!usdcCoin || !targetCoin) {
    throw new Error(`Cannot build USDC -> token leg for pool ${pool.address}`);
  }

  return {
    chainId: pool.chainId,
    venue: "curve",
    poolAddress: pool.address,
    poolName: pool.name,
    tokenInAddress: usdcCoin.address,
    tokenOutAddress: targetCoin.address,
    tokenInSymbol: usdcCoin.symbol,
    tokenOutSymbol: targetCoin.symbol,
    tokenInIndex: usdcCoin.index,
    tokenOutIndex: targetCoin.index,
    tokenInDecimals: usdcCoin.decimals,
    tokenOutDecimals: targetCoin.decimals,
  };
}

function buildTokenToUsdcLeg(pool: DiscoveredCurvePool, tokenAddress: string): PathLeg {
  const usdcCoin = pool.coins.find((coin) => coin.address === pool.usdcCoinAddress);
  const targetCoin = pool.coins.find(
    (coin) => coin.address.toLowerCase() === tokenAddress.toLowerCase()
  );

  if (!usdcCoin || !targetCoin) {
    throw new Error(`Cannot build token -> USDC leg for pool ${pool.address}`);
  }

  return {
    chainId: pool.chainId,
    venue: "curve",
    poolAddress: pool.address,
    poolName: pool.name,
    tokenInAddress: targetCoin.address,
    tokenOutAddress: usdcCoin.address,
    tokenInSymbol: targetCoin.symbol,
    tokenOutSymbol: usdcCoin.symbol,
    tokenInIndex: targetCoin.index,
    tokenOutIndex: usdcCoin.index,
    tokenInDecimals: targetCoin.decimals,
    tokenOutDecimals: usdcCoin.decimals,
  };
}

function buildInternalPoolLeg(
  internalPool: DiscoveredCurvePool,
  fromTokenAddress: string,
  toTokenAddress: string
): PathLeg {
  const fromCoin = internalPool.coins.find(
    (coin) => coin.address.toLowerCase() === fromTokenAddress.toLowerCase()
  );
  const toCoin = internalPool.coins.find(
    (coin) => coin.address.toLowerCase() === toTokenAddress.toLowerCase()
  );

  if (!fromCoin || !toCoin) {
    throw new Error(
      `Cannot build internal leg ${fromTokenAddress} -> ${toTokenAddress} for pool ${internalPool.address}`
    );
  }

  return {
    chainId: internalPool.chainId,
    venue: "curve",
    poolAddress: internalPool.address,
    poolName: internalPool.name,
    tokenInAddress: fromCoin.address,
    tokenOutAddress: toCoin.address,
    tokenInSymbol: fromCoin.symbol,
    tokenOutSymbol: toCoin.symbol,
    tokenInIndex: fromCoin.index,
    tokenOutIndex: toCoin.index,
    tokenInDecimals: fromCoin.decimals,
    tokenOutDecimals: toCoin.decimals,
  };
}

export function buildInternalImbalanceCandidates(
  reports: PoolImbalanceReport[],
  minImbalancePct = 15,
  discoveredPools: DiscoveredCurvePool[] = []
): OpportunityCandidate[] {
  const candidates: OpportunityCandidate[] = [];

  for (const report of reports) {
    if (report.imbalancePct < minImbalancePct) continue;

    const pool = findPoolByAddress(discoveredPools, report.poolAddress);
    if (!pool || pool.coins.length !== 2) continue;

    const [coin0, coin1] = pool.coins;

    candidates.push({
      key: ["internal", report.poolAddress.toLowerCase(), "token0_to_token1"].join(":"),
      poolAddress: report.poolAddress as Address,
      poolName: report.poolName,
      trigger: "internal_imbalance",
      direction: "token0_to_token1",
      token0Address: coin0.address,
      token0Symbol: coin0.symbol,
      token1Address: coin1.address,
      token1Symbol: coin1.symbol,
      imbalancePct: report.imbalancePct,
      classification: report.classification,
    });

    candidates.push({
      key: ["internal", report.poolAddress.toLowerCase(), "token1_to_token0"].join(":"),
      poolAddress: report.poolAddress as Address,
      poolName: report.poolName,
      trigger: "internal_imbalance",
      direction: "token1_to_token0",
      token0Address: coin0.address,
      token0Symbol: coin0.symbol,
      token1Address: coin1.address,
      token1Symbol: coin1.symbol,
      imbalancePct: report.imbalancePct,
      classification: report.classification,
    });
  }

  return candidates;
}

export function buildExecutableInternalPaths(args: {
  candidates: OpportunityCandidate[];
  discoveredPools: DiscoveredCurvePool[];
}): GeneratedPath[] {
  const paths: GeneratedPath[] = [];
  const seen = new Set<string>();

  for (const candidate of args.candidates) {
    const internalPool = findPoolByAddress(args.discoveredPools, candidate.poolAddress);

    if (!internalPool) continue;

    const entryTokenAddress =
      candidate.direction === "token0_to_token1"
        ? candidate.token0Address
        : candidate.token1Address;

    const exitTokenAddress =
      candidate.direction === "token0_to_token1"
        ? candidate.token1Address
        : candidate.token0Address;

    const entryPools = findUsdcPoolsForToken(args.discoveredPools, entryTokenAddress);
    const exitPools = findUsdcPoolsForToken(args.discoveredPools, exitTokenAddress);

    for (const entryPool of entryPools) {
      for (const exitPool of exitPools) {
        try {
          const leg1 = buildUsdcToTokenLeg(entryPool, entryTokenAddress);
          const leg2 = buildInternalPoolLeg(internalPool, entryTokenAddress, exitTokenAddress);
          const leg3 = buildTokenToUsdcLeg(exitPool, exitTokenAddress);

          const uniquePoolCount = new Set([
            leg1.poolAddress.toLowerCase(),
            leg2.poolAddress.toLowerCase(),
            leg3.poolAddress.toLowerCase(),
          ]).size;

          if (uniquePoolCount < 2) {
            continue;
          }

          const key = [
            candidate.key,
            leg1.poolAddress.toLowerCase(),
            leg2.poolAddress.toLowerCase(),
            leg3.poolAddress.toLowerCase(),
            `${leg1.tokenInAddress.toLowerCase()}->${leg1.tokenOutAddress.toLowerCase()}`,
            `${leg2.tokenInAddress.toLowerCase()}->${leg2.tokenOutAddress.toLowerCase()}`,
            `${leg3.tokenInAddress.toLowerCase()}->${leg3.tokenOutAddress.toLowerCase()}`,
          ].join(":");

          if (seen.has(key)) {
            continue;
          }

          seen.add(key);

          paths.push({
            key,
            type: "multi-hop-roundtrip",
            sharedTokenAddress: leg2.tokenOutAddress,
            sharedTokenSymbol: `${leg2.tokenInSymbol}->${leg2.tokenOutSymbol}`,
            legs: [leg1, leg2, leg3],
          });
        } catch {
          continue;
        }
      }
    }
  }

  return paths;
}