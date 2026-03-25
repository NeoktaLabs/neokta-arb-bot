// src/engine/paths/path.generator.ts

import type { DiscoveredCurvePool } from "../../integrations/curve/curve.discovery";
import type { GeneratedPath, PathLeg } from "./path.types";

function isUsdc(symbol: string): boolean {
  return symbol.toUpperCase() === "USDC";
}

function buildUsdcToTokenLeg(pool: DiscoveredCurvePool): PathLeg | null {
  const usdcCoin = pool.coins.find((coin) => isUsdc(coin.symbol));
  const otherCoin = pool.coins.find((coin) => !isUsdc(coin.symbol));

  if (!usdcCoin || !otherCoin) {
    return null;
  }

  return {
    poolAddress: pool.address,
    poolName: pool.name,

    tokenInSymbol: usdcCoin.symbol,
    tokenOutSymbol: otherCoin.symbol,

    tokenInIndex: usdcCoin.index,
    tokenOutIndex: otherCoin.index,

    tokenInDecimals: usdcCoin.decimals,
    tokenOutDecimals: otherCoin.decimals,
  };
}

function buildTokenToUsdcLeg(pool: DiscoveredCurvePool): PathLeg | null {
  const usdcCoin = pool.coins.find((coin) => isUsdc(coin.symbol));
  const otherCoin = pool.coins.find((coin) => !isUsdc(coin.symbol));

  if (!usdcCoin || !otherCoin) {
    return null;
  }

  return {
    poolAddress: pool.address,
    poolName: pool.name,

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

  // Same-pool baseline roundtrips
  for (const pool of usdcPools) {
    const leg1 = buildUsdcToTokenLeg(pool);
    const leg2 = buildTokenToUsdcLeg(pool);

    if (!leg1 || !leg2) {
      continue;
    }

    paths.push({
      type: "same-pool-roundtrip",
      sharedTokenSymbol: leg1.tokenOutSymbol,
      legs: [leg1, leg2],
    });
  }

  // Cross-pool roundtrips
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

      if (leg1.tokenOutSymbol.toUpperCase() !== leg2.tokenInSymbol.toUpperCase()) {
        continue;
      }

      paths.push({
        type: "cross-pool-roundtrip",
        sharedTokenSymbol: leg1.tokenOutSymbol,
        legs: [leg1, leg2],
      });
    }
  }

  return paths;
}