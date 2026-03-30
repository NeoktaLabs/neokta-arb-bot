// src/engine/paths/arb-path.generator.ts

import type { ArbCandidate } from "../universe/universe.types";
import type { GeneratedPath, PathLeg } from "./path.types";

function buildUsdcToTokenLeg(pool: ArbCandidate["pools"][number]): PathLeg {
  return {
    chainId: pool.chainId,
    venue: "curve",
    poolAddress: pool.address,
    poolName: pool.name ?? pool.address,

    tokenInAddress: pool.usdcAddress,
    tokenOutAddress: pool.tokenAddress,

    tokenInSymbol: pool.usdcSymbol,
    tokenOutSymbol: pool.tokenSymbol,

    tokenInIndex: pool.usdcIndex,
    tokenOutIndex: pool.tokenIndex,

    tokenInDecimals: pool.usdcDecimals,
    tokenOutDecimals: pool.tokenDecimals,
  };
}

function buildTokenToUsdcLeg(pool: ArbCandidate["pools"][number]): PathLeg {
  return {
    chainId: pool.chainId,
    venue: "curve",
    poolAddress: pool.address,
    poolName: pool.name ?? pool.address,

    tokenInAddress: pool.tokenAddress,
    tokenOutAddress: pool.usdcAddress,

    tokenInSymbol: pool.tokenSymbol,
    tokenOutSymbol: pool.usdcSymbol,

    tokenInIndex: pool.tokenIndex,
    tokenOutIndex: pool.usdcIndex,

    tokenInDecimals: pool.tokenDecimals,
    tokenOutDecimals: pool.usdcDecimals,
  };
}

export function generateArbPaths(candidates: ArbCandidate[]): GeneratedPath[] {
  const paths: GeneratedPath[] = [];

  for (const candidate of candidates) {
    for (let i = 0; i < candidate.pools.length; i++) {
      for (let j = 0; j < candidate.pools.length; j++) {
        if (i === j) continue;

        const entryPool = candidate.pools[i];
        const exitPool = candidate.pools[j];

        const leg1 = buildUsdcToTokenLeg(entryPool);
        const leg2 = buildTokenToUsdcLeg(exitPool);

        const key = [
          "cross",
          candidate.tokenAddress.toLowerCase(),
          entryPool.address.toLowerCase(),
          exitPool.address.toLowerCase(),
        ].join(":");

        paths.push({
          key,
          type: "cross-pool-roundtrip",
          sharedTokenAddress: candidate.tokenAddress,
          sharedTokenSymbol: candidate.tokenSymbol,
          legs: [leg1, leg2],
        });
      }
    }
  }

  return paths;
}