// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { getEnv } from "../config/env";
import { buildPoolHealthSummaries } from "../engine/filters/pool-quality.filter";
import { classifySimulationResult } from "../engine/filters/result-quality.filter";
import { generatePaths } from "../engine/paths/path.generator";
import { generateArbPaths } from "../engine/paths/arb-path.generator";
import { simulatePath } from "../engine/paths/path.simulator";
import {
  buildTokenClusters,
  buildTrustedPools,
  findArbCandidates,
} from "../engine/universe/universe.builder";
import { discoverCurvePools } from "../integrations/curve/curve.discovery";
import { logInfo } from "../lib/logger";

export async function runScan(env: Env) {
  const config = getEnv(env);

  const discoveredPools = await discoverCurvePools(env);

  const twoCoinPools = discoveredPools.filter((pool) => pool.isTwoCoinPool);
  const usdcPools = twoCoinPools.filter((pool) => pool.hasUsdc);

  // Baseline same-pool paths
  const baselinePaths = generatePaths(usdcPools);

  const baselineRawResults = [];
  for (const path of baselinePaths) {
    const simulation = await simulatePath(env, path, config.initialUsdc);
    const classification = classifySimulationResult(simulation);

    baselineRawResults.push({
      ...simulation,
      health: classification.health,
      healthReasons: classification.reasons,
    });
  }

  const healthyBaselineResults = baselineRawResults.filter(
    (result: any) => result.health === "healthy"
  );
  const suspiciousBaselineResults = baselineRawResults.filter(
    (result: any) => result.health === "suspicious"
  );
  const unsupportedBaselineResults = baselineRawResults.filter(
    (result: any) => result.health === "unsupported"
  );

  const poolHealth = buildPoolHealthSummaries(baselineRawResults);

  // Trusted universe
  const trustedPools = buildTrustedPools(discoveredPools, poolHealth);
  const tokenClusters = buildTokenClusters(trustedPools);
  const arbCandidates = findArbCandidates(tokenClusters);

  // Cross-pool arbitrage paths
  const arbPaths = generateArbPaths(arbCandidates);

  const arbResults = [];
  for (const path of arbPaths) {
    const simulation = await simulatePath(env, path, config.initialUsdc);
    const classification = classifySimulationResult(simulation);

    arbResults.push({
      ...simulation,
      health: classification.health,
      healthReasons: classification.reasons,
    });
  }

  const healthyArbResults = arbResults.filter((result: any) => result.health === "healthy");
  const suspiciousArbResults = arbResults.filter((result: any) => result.health === "suspicious");
  const unsupportedArbResults = arbResults.filter((result: any) => result.health === "unsupported");

  const profitableArbResults = healthyArbResults
    .filter((result: any) => typeof result.pnlUsd === "number")
    .filter((result: any) => result.pnlUsd > config.minProfitUsd)
    .sort((a: any, b: any) => b.pnlUsd - a.pnlUsd);

  const output = {
    totalConfiguredPools: discoveredPools.length,
    totalTwoCoinPools: twoCoinPools.length,
    totalUsdcTwoCoinPools: usdcPools.length,

    poolHealth,

    trustedPools,
    tokenClusters,
    arbCandidates,

    baseline: {
      totalPaths: baselinePaths.length,
      totalSimulations: baselineRawResults.length,
      healthyCount: healthyBaselineResults.length,
      suspiciousCount: suspiciousBaselineResults.length,
      unsupportedCount: unsupportedBaselineResults.length,
      healthyResults: healthyBaselineResults,
      suspiciousResults: suspiciousBaselineResults,
      unsupportedResults: unsupportedBaselineResults,
    },

    arbitrage: {
      totalPaths: arbPaths.length,
      totalSimulations: arbResults.length,
      healthyCount: healthyArbResults.length,
      suspiciousCount: suspiciousArbResults.length,
      unsupportedCount: unsupportedArbResults.length,
      profitableCount: profitableArbResults.length,
      profitable: profitableArbResults,
      healthyResults: healthyArbResults,
      suspiciousResults: suspiciousArbResults,
      unsupportedResults: unsupportedArbResults,
    },
  };

  logInfo("Scan result", {
    totalConfiguredPools: output.totalConfiguredPools,
    trustedPools: output.trustedPools.length,
    arbCandidates: output.arbCandidates.length,
    baselinePaths: output.baseline.totalPaths,
    arbPaths: output.arbitrage.totalPaths,
    profitableArb: output.arbitrage.profitableCount,
  });

  return output;
}