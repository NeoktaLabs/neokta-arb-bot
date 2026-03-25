// src/engine/paths/path.generator.ts

import type { DiscoveredCurvePool } from "../../integrations/curve/curve.types";
import type { GeneratedPath, PathLeg } from "./path.types";

function buildUsdcToTokenLeg(pool: DiscoveredCurvePool): PathLeg | null {
  const usdcCoin = pool.coins.find((coin) => coin.address === pool.usdcCoinAddress);
  const otherCoin = pool.coins.find((coin) => coin.address !== pool.usdcCoinAddress);

  if (!usdcCoin || !otherCoin) {
    return null;
  }

  return {
    poolAddress: pool.address,
    poolName: pool.name,

    tokenInAddress: usdcCoin.address,
    tokenOutAddress: otherCoin.address,

    tokenInSymbol: usdcCoin.symbol,
    tokenOutSymbol: otherCoin.symbol,

    tokenInIndex: usdcCoin.index,
    tokenOutIndex: otherCoin.index,

    tokenInDecimals: usdcCoin.decimals,
    tokenOutDecimals: otherCoin.decimals,
  };
}

function buildTokenToUsdcLeg(pool: DiscoveredCurvePool): PathLeg | null {
  const usdcCoin = pool.coins.find((coin) => coin.address === pool.usdcCoinAddress);
  const otherCoin = pool.coins.find((coin) => coin.address !== pool.usdcCoinAddress);

  if (!usdcCoin || !otherCoin) {
    return null;
  }

  return {
    poolAddress: pool.address,
    poolName: pool.name,

    tokenInAddress: otherCoin.address,
    tokenOutAddress: usdcCoin.address,

    tokenInSymbol: otherCoin.symbol,
    tokenOutSymbol: usdcCoin.symbol,

    tokenInIndex: otherCoin.index,
    tokenOutIndex: usdcCoin.index,

    tokenInDecimals: otherCoin.decimals,
    tokenOutDecimals: usdcCoin.decimals,
  };
}

export function generatePaths(pools: DiscoveredCurvePool[]): GeneratedPath[] {
  const usdcPools = pools.filter((pool) => pool.hasUsdc);
  const paths: GeneratedPath[] = [];

  for (const pool of usdcPools) {
    const leg1 = buildUsdcToTokenLeg(pool);
    const leg2 = buildTokenToUsdcLeg(pool);

    if (!leg1 || !leg2) {
      continue;
    }

    paths.push({
      key: ["same", pool.address.toLowerCase(), leg1.tokenOutAddress.toLowerCase()].join(":"),
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

      if (leg1.tokenOutAddress !== leg2.tokenInAddress) {
        continue;
      }

      paths.push({
        key: [
          "cross",
          leg1.tokenOutAddress.toLowerCase(),
          poolA.address.toLowerCase(),
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