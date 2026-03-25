// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { getEnv } from "../config/env";
import { buildPoolHealthSummaries } from "../engine/filters/pool-quality.filter";
import { classifySimulationResult } from "../engine/filters/result-quality.filter";
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

  const rawResults = [];
  for (const path of paths) {
    const simulation = await simulatePath(env, path, config.initialUsdc);
    const classification = classifySimulationResult(simulation);

    rawResults.push({
      ...simulation,
      health: classification.health,
      healthReasons: classification.reasons,
    });
  }

  const healthyResults = rawResults.filter((result: any) => result.health === "healthy");
  const suspiciousResults = rawResults.filter((result: any) => result.health === "suspicious");
  const unsupportedResults = rawResults.filter((result: any) => result.health === "unsupported");

  const profitable = healthyResults.filter((result: any) => {
    return typeof result.pnlUsd === "number" && result.pnlUsd > config.minProfitUsd;
  });

  const poolHealth = buildPoolHealthSummaries(rawResults);

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

    poolHealth,

    totalPaths: paths.length,
    totalSimulations: rawResults.length,

    healthyCount: healthyResults.length,
    suspiciousCount: suspiciousResults.length,
    unsupportedCount: unsupportedResults.length,

    profitableCount: profitable.length,
    profitable,

    healthyResults,
    suspiciousResults,
    unsupportedResults,
  };

  logInfo("Scan result", {
    totalConfiguredPools: output.totalConfiguredPools,
    totalTwoCoinPools: output.totalTwoCoinPools,
    totalUsdcTwoCoinPools: output.totalUsdcTwoCoinPools,
    totalPaths: output.totalPaths,
    healthyCount: output.healthyCount,
    suspiciousCount: output.suspiciousCount,
    unsupportedCount: output.unsupportedCount,
    profitableCount: output.profitableCount,
  });

  return output;
}