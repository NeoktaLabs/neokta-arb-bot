// src/integrations/curve/curve.discovery.ts

import { getEnv } from "../../config/env";
import { isUsdcAddress } from "../../domain/constants";
import type { ChainId } from "../../domain/chains";
import type { Env } from "../../domain/types";
import { logError, logInfo } from "../../lib/logger";
import { hasThirdCoin, getCurvePoolSnapshot } from "./curve.client";
import { getCurvePoolsForChain } from "./curve.pools";
import type { DiscoveredCurvePool } from "./curve.types";

export async function discoverCurvePools(
  env: Env,
  chainId: ChainId
): Promise<DiscoveredCurvePool[]> {
  const config = getEnv(env, chainId);
  const results: DiscoveredCurvePool[] = [];

  for (const pool of getCurvePoolsForChain(chainId)) {
    try {
      const snapshot = await getCurvePoolSnapshot(env, chainId, pool.address);
      const thirdCoin = await hasThirdCoin(env, chainId, pool.address);
      const usdcCoin = snapshot.coins.find((coin) =>
        isUsdcAddress(coin.address, config.usdcAddress)
      );

      const discovered: DiscoveredCurvePool = {
        chainId,
        name: pool.name,
        address: pool.address,
        coins: snapshot.coins,
        balances: snapshot.balances,
        hasUsdc: Boolean(usdcCoin),
        isTwoCoinPool: !thirdCoin,
        usdcCoinAddress: usdcCoin?.address ?? null,
      };

      results.push(discovered);

      logInfo("curve.pool.discovered", {
        chainId,
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
      logError("curve.pool.discovery_failed", {
        chainId,
        pool: pool.name,
        address: pool.address,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}