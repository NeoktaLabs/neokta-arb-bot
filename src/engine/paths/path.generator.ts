// src/engine/paths/path.generator.ts

import type { DiscoveredCurvePool } from "../../integrations/curve/curve.discovery";
import type { GeneratedPath } from "./path.types";

export function generatePaths(
  pools: DiscoveredCurvePool[]
): GeneratedPath[] {
  const paths: GeneratedPath[] = [];

  for (const pool of pools) {
    if (!pool.hasUsdc) continue;

    const usdcCoin = pool.coins.find(
      (c) => c.symbol.toUpperCase() === "USDC"
    );

    const otherCoin = pool.coins.find(
      (c) => c.symbol.toUpperCase() !== "USDC"
    );

    if (!usdcCoin || !otherCoin) continue;

    paths.push({
      poolAddress: pool.address,
      poolName: pool.name,

      tokenInSymbol: usdcCoin.symbol,
      tokenOutSymbol: otherCoin.symbol,

      tokenInIndex: usdcCoin.index,
      tokenOutIndex: otherCoin.index,

      tokenInDecimals: usdcCoin.decimals,
      tokenOutDecimals: otherCoin.decimals,
    });
  }

  return paths;
}