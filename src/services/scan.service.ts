// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { getEnv } from "../config/env";
import { buildPoolHealthSummaries } from "../engine/filters/pool-quality.filter";
import { classifySimulationResult } from "../engine/filters/result-quality.filter";
import { generatePaths } from "../engine/paths/path.generator";
import { simulatePath } from "../engine/paths/path.simulator";
import { discoverCurvePools } from "../integrations/curve/curve.discovery";
import { logInfo } from "../lib/logger";

// NEW
import {
  buildTrustedPools,
  buildTokenClusters,
  findArbCandidates,
} from "../engine/universe/universe.builder";

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

  const healthyResults = rawResults.filter((r: any) => r.health === "healthy");
  const suspiciousResults = rawResults.filter((r: any) => r.health === "suspicious");
  const unsupportedResults = rawResults.filter((r: any) => r.health === "unsupported");

  const profitable = healthyResults.filter((r: any) => {
    return typeof r.pnlUsd === "number" && r.pnlUsd > config.minProfitUsd;
  });

  const poolHealth = buildPoolHealthSummaries(rawResults);

  // 🧠 NEW — UNIVERSE
  const trustedPools = buildTrustedPools(healthyResults);
  const tokenClusters = buildTokenClusters(trustedPools);
  const arbCandidates = findArbCandidates(tokenClusters);

  const output = {
    totalConfiguredPools: pools.length,
    totalTwoCoinPools: twoCoinPools.length,
    totalUsdcTwoCoinPools: usdcPools.length,

    totalPaths: paths.length,
    totalSimulations: rawResults.length,

    healthyCount: healthyResults.length,
    suspiciousCount: suspiciousResults.length,
    unsupportedCount: unsupportedResults.length,

    poolHealth,

    // 🧠 NEW OUTPUT
    trustedPools,
    tokenClusters,
    arbCandidates,

    profitableCount: profitable.length,
    profitable,
  };

  logInfo("Scan result", {
    totalConfiguredPools: output.totalConfiguredPools,
    totalPaths: output.totalPaths,
    healthyCount: output.healthyCount,
    arbCandidates: output.arbCandidates.length,
  });

  return output;
}