// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { getEnv } from "../config/env";
import { buildPoolHealthSummaries } from "../engine/filters/pool-quality.filter";
import { classifySimulationResult } from "../engine/filters/result-quality.filter";
import { buildTokenGraph } from "../engine/graph/graph.builder";
import { generateArbPaths } from "../engine/paths/arb-path.generator";
import { generateMultiHopPaths } from "../engine/paths/multi-hop.generator";
import { generatePaths } from "../engine/paths/path.generator";
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

  // 1. Baseline same-pool paths
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

  // 2. Pool health from baseline behavior
  const poolHealth = buildPoolHealthSummaries(baselineRawResults);

  // 3. Trusted universe from healthy pools
  const trustedPools = buildTrustedPools(discoveredPools, poolHealth);
  const tokenClusters = buildTokenClusters(trustedPools);
  const arbCandidates = findArbCandidates(tokenClusters);

  // 4. Cross-pool same-token arbitrage paths
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

  // 5. Multi-hop graph paths
  const graph = buildTokenGraph(discoveredPools);
  const multiHopPaths = generateMultiHopPaths(graph);

  const multiHopResults = [];
  for (const path of multiHopPaths) {
    const simulation = await simulatePath(env, path, config.initialUsdc);
    const classification = classifySimulationResult(simulation);

    multiHopResults.push({
      ...simulation,
      health: classification.health,
      healthReasons: classification.reasons,
    });
  }

  const healthyMultiHopResults = multiHopResults.filter(
    (result: any) => result.health === "healthy"
  );
  const suspiciousMultiHopResults = multiHopResults.filter(
    (result: any) => result.health === "suspicious"
  );
  const unsupportedMultiHopResults = multiHopResults.filter(
    (result: any) => result.health === "unsupported"
  );

  const profitableMultiHopResults = healthyMultiHopResults
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

    multiHop: {
      totalPaths: multiHopPaths.length,
      totalSimulations: multiHopResults.length,
      healthyCount: healthyMultiHopResults.length,
      suspiciousCount: suspiciousMultiHopResults.length,
      unsupportedCount: unsupportedMultiHopResults.length,
      profitableCount: profitableMultiHopResults.length,
      profitable: profitableMultiHopResults,
      healthyResults: healthyMultiHopResults,
      suspiciousResults: suspiciousMultiHopResults,
      unsupportedResults: unsupportedMultiHopResults,
    },
  };

  logInfo("Scan result", {
    totalConfiguredPools: output.totalConfiguredPools,
    trustedPools: output.trustedPools.length,
    arbCandidates: output.arbCandidates.length,
    baselinePaths: output.baseline.totalPaths,
    arbPaths: output.arbitrage.totalPaths,
    multiHopPaths: output.multiHop.totalPaths,
    profitableArb: output.arbitrage.profitableCount,
    profitableMultiHop: output.multiHop.profitableCount,
  });

  return output;
}