// src/integrations/curve/curve.discovery.ts

import type { Env } from "../../domain/types";
import { logError, logInfo } from "../../lib/logger";
import { hasThirdCoin, getCurvePoolSnapshot } from "./curve.client";
import { CURVE_POOLS } from "./curve.pools";
import type { DiscoveredCurvePool } from "./curve.types";

function isUsdc(symbol: string): boolean {
  const normalized = symbol.trim().toUpperCase();
  return normalized === "USDC" || normalized === "USDCE" || normalized === "USDC.E";
}

export async function discoverCurvePools(env: Env): Promise<DiscoveredCurvePool[]> {
  const results: DiscoveredCurvePool[] = [];

  for (const pool of CURVE_POOLS) {
    try {
      const snapshot = await getCurvePoolSnapshot(env, pool.address);
      const thirdCoin = await hasThirdCoin(env, pool.address);

      const discovered: DiscoveredCurvePool = {
        name: pool.name,
        address: pool.address,
        coins: snapshot.coins,
        hasUsdc: snapshot.coins.some((coin) => isUsdc(coin.symbol)),
        isTwoCoinPool: !thirdCoin,
      };

      results.push(discovered);

      logInfo("Discovered Curve pool", {
        pool: pool.name,
        address: pool.address,
        coins: snapshot.coins.map((coin) => ({
          index: coin.index,
          symbol: coin.symbol,
          decimals: coin.decimals,
        })),
        hasUsdc: discovered.hasUsdc,
        isTwoCoinPool: discovered.isTwoCoinPool,
      });
    } catch (error) {
      logError("Failed to discover Curve pool", {
        pool: pool.name,
        address: pool.address,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}