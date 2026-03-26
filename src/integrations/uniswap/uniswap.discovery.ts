// src/integrations/uniswap/uniswap.discovery.ts

import type { AppConfig } from "../../domain/app-config.types";
import { isUsdcAddress } from "../../domain/constants";
import type { Env } from "../../domain/types";
import { logError, logInfo } from "../../lib/logger";
import { getUniswapPoolAddress, getUniswapPoolSnapshot } from "./uniswap.client";
import { ETHEREUM_UNISWAP_POOLS } from "./uniswap.pools";
import type { DiscoveredUniswapPool } from "./uniswap.types";

export async function discoverUniswapPools(env: Env, config: AppConfig): Promise<DiscoveredUniswapPool[]> {
  if (config.chainId !== "ethereum" || !config.enableUniswap) return [];
  const results: DiscoveredUniswapPool[] = [];
  for (const seed of ETHEREUM_UNISWAP_POOLS) {
    try {
      const poolAddress = await getUniswapPoolAddress(env, config.uniswapFactoryAddress, seed.token0, seed.token1, seed.fee);
      if (!poolAddress || poolAddress === "0x0000000000000000000000000000000000000000") continue;
      const snapshot = await getUniswapPoolSnapshot(env, poolAddress);
      const usdcToken = [snapshot.token0, snapshot.token1].find((t) => isUsdcAddress(t.address, config.usdcAddress));
      const discovered: DiscoveredUniswapPool = {
        name: seed.name,
        address: poolAddress,
        token0: snapshot.token0,
        token1: snapshot.token1,
        fee: snapshot.fee,
        liquidity: snapshot.liquidity,
        sqrtPriceX96: snapshot.sqrtPriceX96,
        tick: snapshot.tick,
        hasUsdc: Boolean(usdcToken),
        usdcTokenAddress: usdcToken?.address ?? null,
      };
      results.push(discovered);
      logInfo("uniswap.discovery.succeeded", { chainId: config.chainId, pool: seed.name, address: poolAddress, fee: snapshot.fee, hasUsdc: discovered.hasUsdc });
    } catch (error) {
      logError("uniswap.discovery.failed", { chainId: config.chainId, pool: seed.name, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
}
