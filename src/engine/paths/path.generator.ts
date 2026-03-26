// src/engine/paths/path.generator.ts

import type { MarketPool } from "../../domain/markets";
import type { GeneratedPath, PathLeg } from "./path.types";

function buildUsdcToTokenLeg(pool: MarketPool): PathLeg | null {
  const usdcCoin = pool.tokens.find((token) => token.address === pool.usdcTokenAddress);
  const otherCoin = pool.tokens.find((token) => token.address !== pool.usdcTokenAddress);

  if (!usdcCoin || !otherCoin) {
    return null;
  }

  return {
    venue: pool.venue,
    poolAddress: pool.address,
    poolName: pool.name,
    tokenInAddress: usdcCoin.address,
    tokenOutAddress: otherCoin.address,
    tokenInSymbol: usdcCoin.symbol,
    tokenOutSymbol: otherCoin.symbol,
    tokenInIndex: usdcCoin.index,
    tokenOutIndex: otherCoin.index,
    fee: pool.fee,
    tokenInDecimals: usdcCoin.decimals,
    tokenOutDecimals: otherCoin.decimals,
  };
}

function buildTokenToUsdcLeg(pool: MarketPool): PathLeg | null {
  const usdcCoin = pool.tokens.find((token) => token.address === pool.usdcTokenAddress);
  const otherCoin = pool.tokens.find((token) => token.address !== pool.usdcTokenAddress);

  if (!usdcCoin || !otherCoin) {
    return null;
  }

  return {
    venue: pool.venue,
    poolAddress: pool.address,
    poolName: pool.name,
    tokenInAddress: otherCoin.address,
    tokenOutAddress: usdcCoin.address,
    tokenInSymbol: otherCoin.symbol,
    tokenOutSymbol: usdcCoin.symbol,
    tokenInIndex: otherCoin.index,
    tokenOutIndex: usdcCoin.index,
    fee: pool.fee,
    tokenInDecimals: otherCoin.decimals,
    tokenOutDecimals: usdcCoin.decimals,
  };
}

export function generatePaths(pools: MarketPool[]): GeneratedPath[] {
  const usdcPools = pools.filter((pool) => pool.hasUsdc);
  const paths: GeneratedPath[] = [];

  for (const pool of usdcPools) {
    const leg1 = buildUsdcToTokenLeg(pool);
    const leg2 = buildTokenToUsdcLeg(pool);

    if (!leg1 || !leg2) {
      continue;
    }

    paths.push({
      key: ["same", pool.venue, pool.address.toLowerCase(), leg1.tokenOutAddress.toLowerCase()].join(":"),
      type: "same-pool-roundtrip",
      sharedTokenAddress: leg1.tokenOutAddress,
      sharedTokenSymbol: leg1.tokenOutSymbol,
      legs: [leg1, leg2],
    });
  }

  for (let i = 0; i < usdcPools.length; i++) {
    for (let j = 0; j < usdcPools.length; j++) {
      if (i === j) {
        continue;
      }

      const poolA = usdcPools[i];
      const poolB = usdcPools[j];

      const leg1 = buildUsdcToTokenLeg(poolA);
      const leg2 = buildTokenToUsdcLeg(poolB);

      if (!leg1 || !leg2) {
        continue;
      }

      if (leg1.tokenOutAddress.toLowerCase() !== leg2.tokenInAddress.toLowerCase()) {
        continue;
      }

      paths.push({
        key: [
          "cross",
          leg1.tokenOutAddress.toLowerCase(),
          poolA.venue,
          poolA.address.toLowerCase(),
          poolB.venue,
          poolB.address.toLowerCase(),
        ].join(":"),
        type: "cross-pool-roundtrip",
        sharedTokenAddress: leg1.tokenOutAddress,
        sharedTokenSymbol: leg1.tokenOutSymbol,
        legs: [leg1, leg2],
      });
    }
  }

  return paths;
}
