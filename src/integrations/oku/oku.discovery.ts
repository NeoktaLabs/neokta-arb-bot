// src/integrations/oku/oku.discovery.ts

import { getEnv } from "../../config/env";
import { isUsdcAddress, normalizeAddress } from "../../domain/constants";
import type { Env } from "../../domain/types";
import { logError, logInfo } from "../../lib/logger";
import { OKU_POOLS } from "./oku.pools";
import type { DiscoveredOkuPool } from "./oku.types";
import { getOkuPoolSnapshot } from "./oku.client";

function buildFallbackName(token0: string, token1: string): string {
  return `Oku ${token0}/${token1}`;
}

export async function discoverOkuPools(env: Env): Promise<DiscoveredOkuPool[]> {
  const config = getEnv(env);
  const results: DiscoveredOkuPool[] = [];

  for (const pool of OKU_POOLS) {
    try {
      const snapshot = await getOkuPoolSnapshot(env, pool.address);
      const usdcToken = [snapshot.token0, snapshot.token1].find((token) =>
        isUsdcAddress(token.address, config.usdcAddress)
      );

      const name =
        pool.name?.trim() || buildFallbackName(snapshot.token0.symbol, snapshot.token1.symbol);

      const discovered: DiscoveredOkuPool = {
        name,
        address: normalizeAddress(snapshot.poolAddress),
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

      logInfo("Discovered Oku pool", {
        pool: discovered.name,
        address: discovered.address,
        token0: discovered.token0,
        token1: discovered.token1,
        fee: discovered.fee,
        liquidity: discovered.liquidity.toString(),
        hasUsdc: discovered.hasUsdc,
      });
    } catch (error) {
      logError("Failed to discover Oku pool", {
        pool: pool.name ?? pool.address,
        address: pool.address,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}
