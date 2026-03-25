// src/engine/opportunities/opportunity.builder.ts

import type { DiscoveredCurvePool } from "../../integrations/curve/curve.types";
import type { PoolImbalanceReport } from "../imbalance/imbalance.types";
import type { GeneratedPath, PathLeg } from "../paths/path.types";
import type { OpportunityCandidate } from "./opportunity.types";

function normalize(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function isUsdc(symbol: string): boolean {
  const s = normalize(symbol);
  return s === "USDC" || s === "USDCE" || s === "USDC.E";
}

export function buildInternalImbalanceCandidates(
  reports: PoolImbalanceReport[],
  minImbalancePct = 15
): OpportunityCandidate[] {
  const candidates: OpportunityCandidate[] = [];

  for (const report of reports) {
    if (report.imbalancePct < minImbalancePct) continue;

    candidates.push({
      key: [
        "internal",
        report.poolAddress.toLowerCase(),
        "token0_to_token1",
      ].join(":"),
      poolAddress: report.poolAddress,
      poolName: report.poolName,
      trigger: "internal_imbalance",
      direction: "token0_to_token1",
      token0Symbol: normalize(report.token0Symbol),
      token1Symbol: normalize(report.token1Symbol),
      imbalancePct: report.imbalancePct,
      classification: report.classification,
    });

    candidates.push({
      key: [
        "internal",
        report.poolAddress.toLowerCase(),
        "token1_to_token0",
      ].join(":"),
      poolAddress: report.poolAddress,
      poolName: report.poolName,
      trigger: "internal_imbalance",
      direction: "token1_to_token0",
      token0Symbol: normalize(report.token0Symbol),
      token1Symbol: normalize(report.token1Symbol),
      imbalancePct: report.imbalancePct,
      classification: report.classification,
    });
  }

  return candidates;
}

function findUsdcPoolsForToken(
  pools: DiscoveredCurvePool[],
  tokenSymbol: string
): DiscoveredCurvePool[] {
  const target = normalize(tokenSymbol);

  return pools.filter((pool) => {
    if (!pool.isTwoCoinPool) return false;
    if (!pool.hasUsdc) return false;

    const symbols = pool.coins.map((coin) => normalize(coin.symbol));
    return symbols.includes(target) && symbols.some(isUsdc);
  });
}

function buildUsdcToTokenLeg(pool: DiscoveredCurvePool, tokenSymbol: string): PathLeg {
  const usdcCoin = pool.coins.find((coin) => isUsdc(coin.symbol));
  const targetCoin = pool.coins.find(
    (coin) => normalize(coin.symbol) === normalize(tokenSymbol)
  );

  if (!usdcCoin || !targetCoin) {
    throw new Error(`Cannot build USDC -> ${tokenSymbol} leg for pool ${pool.address}`);
  }

  return {
    poolAddress: pool.address,
    poolName: pool.name,
    tokenInSymbol: usdcCoin.symbol,
    tokenOutSymbol: targetCoin.symbol,
    tokenInIndex: usdcCoin.index,
    tokenOutIndex: targetCoin.index,
    tokenInDecimals: usdcCoin.decimals,
    tokenOutDecimals: targetCoin.decimals,
  };
}

function buildTokenToUsdcLeg(pool: DiscoveredCurvePool, tokenSymbol: string): PathLeg {
  const usdcCoin = pool.coins.find((coin) => isUsdc(coin.symbol));
  const targetCoin = pool.coins.find(
    (coin) => normalize(coin.symbol) === normalize(tokenSymbol)
  );

  if (!usdcCoin || !targetCoin) {
    throw new Error(`Cannot build ${tokenSymbol} -> USDC leg for pool ${pool.address}`);
  }

  return {
    poolAddress: pool.address,
    poolName: pool.name,
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
  fromToken: string,
  toToken: string
): PathLeg {
  const fromCoin = internalPool.coins.find(
    (coin) => normalize(coin.symbol) === normalize(fromToken)
  );
  const toCoin = internalPool.coins.find(
    (coin) => normalize(coin.symbol) === normalize(toToken)
  );

  if (!fromCoin || !toCoin) {
    throw new Error(
      `Cannot build internal leg ${fromToken} -> ${toToken} for pool ${internalPool.address}`
    );
  }

  return {
    poolAddress: internalPool.address,
    poolName: internalPool.name,
    tokenInSymbol: fromCoin.symbol,
    tokenOutSymbol: toCoin.symbol,
    tokenInIndex: fromCoin.index,
    tokenOutIndex: toCoin.index,
    tokenInDecimals: fromCoin.decimals,
    tokenOutDecimals: toCoin.decimals,
  };
}

export function buildExecutableInternalPaths(args: {
  candidates: OpportunityCandidate[];
  discoveredPools: DiscoveredCurvePool[];
}): GeneratedPath[] {
  const paths: GeneratedPath[] = [];
  const seen = new Set<string>();

  for (const candidate of args.candidates) {
    const internalPool = args.discoveredPools.find(
      (pool) => pool.address.toLowerCase() === candidate.poolAddress.toLowerCase()
    );

    if (!internalPool) continue;

    const entryToken =
      candidate.direction === "token0_to_token1"
        ? candidate.token0Symbol
        : candidate.token1Symbol;

    const exitToken =
      candidate.direction === "token0_to_token1"
        ? candidate.token1Symbol
        : candidate.token0Symbol;

    // Ignore trivial constructions where the "entry token" or "exit token"
    // is already USDC. Those are not real internal arbitrage paths.
    if (isUsdc(entryToken) || isUsdc(exitToken)) {
      continue;
    }

    const entryPools = findUsdcPoolsForToken(args.discoveredPools, entryToken);
    const exitPools = findUsdcPoolsForToken(args.discoveredPools, exitToken);

    for (const entryPool of entryPools) {
      for (const exitPool of exitPools) {
        try {
          const leg1 = buildUsdcToTokenLeg(entryPool, entryToken);
          const leg2 = buildInternalPoolLeg(internalPool, entryToken, exitToken);
          const leg3 = buildTokenToUsdcLeg(exitPool, exitToken);

          // Avoid degenerate repetition where all legs collapse into the same pool pattern
          // in a way that doesn't create a distinct USDC -> tokenA -> tokenB -> USDC route.
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
            `${normalize(leg1.tokenInSymbol)}->${normalize(leg1.tokenOutSymbol)}`,
            `${normalize(leg2.tokenInSymbol)}->${normalize(leg2.tokenOutSymbol)}`,
            `${normalize(leg3.tokenInSymbol)}->${normalize(leg3.tokenOutSymbol)}`,
          ].join(":");

          if (seen.has(key)) {
            continue;
          }

          seen.add(key);

          paths.push({
            key,
            type: "multi-hop-roundtrip",
            sharedTokenSymbol: `${entryToken}->${exitToken}`,
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