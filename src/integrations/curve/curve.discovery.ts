// src/integrations/curve/curve.discovery.ts

import type { Env } from "../../domain/types";
import { CURVE_POOLS } from "./curve.pools";
import { getCurvePoolSnapshot } from "./curve.client";

export interface DiscoveredCurvePool {
  name: string;
  address: string;
  coins: {
    symbol: string;
    decimals: number;
    index: number;
  }[];
  hasUsdc: boolean;
}

export async function discoverCurvePools(env: Env) {
  const results: DiscoveredCurvePool[] = [];

  for (const pool of CURVE_POOLS) {
    try {
      const snapshot = await getCurvePoolSnapshot(env, pool.address);

      const coins = snapshot.coins.map((c) => ({
        symbol: c.symbol,
        decimals: c.decimals,
        index: c.index,
      }));

      const hasUsdc = coins.some(
        (c) => c.symbol.toUpperCase() === "USDC"
      );

      results.push({
        name: pool.name,
        address: pool.address,
        coins,
        hasUsdc,
      });
    } catch (err) {
      console.error("Failed to load pool", pool.address, err);
    }
  }

  return results;
}