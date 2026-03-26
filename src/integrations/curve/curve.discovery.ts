// src/integrations/curve/curve.discovery.ts

import type { AppConfig } from "../../domain/app-config.types";
import { isUsdcAddress } from "../../domain/constants";
import type { Env } from "../../domain/types";
import { logError, logInfo } from "../../lib/logger";
import { hasThirdCoin, getCurvePoolSnapshot } from "./curve.client";
import { getCurvePoolsForChain } from "./curve.pools";
import type { DiscoveredCurvePool } from "./curve.types";

export async function discoverCurvePools(env: Env, config: AppConfig): Promise<DiscoveredCurvePool[]> {
  const results: DiscoveredCurvePool[] = [];

  for (const pool of getCurvePoolsForChain(config.chainId)) {
    try {
      const snapshot = await getCurvePoolSnapshot(env, config.chainId, pool.address);
      const thirdCoin = await hasThirdCoin(env, config.chainId, pool.address);
      const usdcCoin = snapshot.coins.find((coin) => isUsdcAddress(coin.address, config.usdcAddress));

      const discovered: DiscoveredCurvePool = {
        chainId: config.chainId,
        name: pool.name,
        address: pool.address,
        coins: snapshot.coins,
        balances: snapshot.balances,
        hasUsdc: Boolean(usdcCoin),
        isTwoCoinPool: !thirdCoin,
        usdcCoinAddress: usdcCoin?.address ?? null,
      };

      results.push(discovered);

      logInfo("curve.discovery.succeeded", {
        chainId: config.chainId,
        pool: pool.name,
        address: pool.address,
        hasUsdc: discovered.hasUsdc,
        isTwoCoinPool: discovered.isTwoCoinPool,
      });
    } catch (error) {
      logError("curve.discovery.failed", {
        chainId: config.chainId,
        pool: pool.name,
        address: pool.address,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}
