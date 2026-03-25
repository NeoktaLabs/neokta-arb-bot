// src/integrations/curve/curve.discovery.ts

import { getEnv } from "../../config/env";
import { isUsdcAddress } from "../../domain/constants";
import type { Env } from "../../domain/types";
import { logError, logInfo } from "../../lib/logger";
import { hasThirdCoin, getCurvePoolSnapshot } from "./curve.client";
import { CURVE_POOLS } from "./curve.pools";
import type { DiscoveredCurvePool } from "./curve.types";

export async function discoverCurvePools(env: Env): Promise<DiscoveredCurvePool[]> {
  const config = getEnv(env);
  const results: DiscoveredCurvePool[] = [];

  for (const pool of CURVE_POOLS) {
    try {
      const snapshot = await getCurvePoolSnapshot(env, pool.address);
      const thirdCoin = await hasThirdCoin(env, pool.address);
      const usdcCoin = snapshot.coins.find((coin) =>
        isUsdcAddress(coin.address, config.usdcAddress)
      );

      const discovered: DiscoveredCurvePool = {
        name: pool.name,
        address: pool.address,
        coins: snapshot.coins,
        balances: snapshot.balances,
        hasUsdc: Boolean(usdcCoin),
        isTwoCoinPool: !thirdCoin,
        usdcCoinAddress: usdcCoin?.address ?? null,
      };

      results.push(discovered);

      logInfo("Discovered Curve pool", {
        pool: pool.name,
        address: pool.address,
        coins: snapshot.coins.map((coin) => ({
          index: coin.index,
          address: coin.address,
          symbol: coin.symbol,
          decimals: coin.decimals,
        })),
        balances: snapshot.balances,
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