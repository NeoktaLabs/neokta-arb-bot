// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { getEnv } from "../config/env";
import { generatePaths } from "../engine/paths/path.generator";
import { simulatePath } from "../engine/paths/path.simulator";
import { discoverCurvePools } from "../integrations/curve/curve.discovery";
import { logInfo } from "../lib/logger";

export async function runScan(env: Env) {
  const config = getEnv(env);

  const pools = await discoverCurvePools(env);

  const twoCoinPools = pools.filter((pool) => pool.isTwoCoinPool);
  const usdcPools = twoCoinPools.filter((pool) => pool.hasUsdc);

  const paths = generatePaths(usdcPools);

  const results = [];
  for (const path of paths) {
    const result = await simulatePath(env, path, config.initialUsdc);
    results.push(result);
  }

  const profitable = results.filter((result: any) => {
    return typeof result.pnlUsd === "number" && result.pnlUsd > config.minProfitUsd;
  });

  const output = {
    totalConfiguredPools: pools.length,
    totalTwoCoinPools: twoCoinPools.length,
    totalUsdcTwoCoinPools: usdcPools.length,
    discoveredPools: pools.map((pool) => ({
      name: pool.name,
      address: pool.address,
      hasUsdc: pool.hasUsdc,
      isTwoCoinPool: pool.isTwoCoinPool,
      coins: pool.coins.map((coin) => ({
        symbol: coin.symbol,
        decimals: coin.decimals,
        index: coin.index,
      })),
    })),
    totalPaths: paths.length,
    totalSimulations: results.length,
    profitableCount: profitable.length,
    profitable,
    results,
  };

  logInfo("Scan result", {
    totalConfiguredPools: output.totalConfiguredPools,
    totalTwoCoinPools: output.totalTwoCoinPools,
    totalUsdcTwoCoinPools: output.totalUsdcTwoCoinPools,
    totalPaths: output.totalPaths,
    profitableCount: output.profitableCount,
  });

  return output;
}