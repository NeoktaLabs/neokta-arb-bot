// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { getEnv } from "../config/env";
import { buildPoolHealthSummaries } from "../engine/filters/pool-quality.filter";
import { classifySimulationResult } from "../engine/filters/result-quality.filter";
import { buildTokenGraph } from "../engine/graph/graph.builder";
import { monitorPoolImbalance } from "../engine/imbalance/imbalance.monitor";
import { buildExecutableInternalPaths, buildInternalImbalanceCandidates } from "../engine/opportunities/opportunity.builder";
import { evaluateOpportunityPaths } from "../engine/opportunities/opportunity.evaluator";
import { generateArbPaths } from "../engine/paths/arb-path.generator";
import { generateMultiHopPaths } from "../engine/paths/multi-hop.generator";
import { generatePaths } from "../engine/paths/path.generator";
import { simulatePath } from "../engine/paths/path.simulator";
import {
  getDefaultSizeLadder,
  simulatePathAcrossSizes,
} from "../engine/sizing/size-ladder";
import {
  buildTokenClusters,
  buildTrustedPools,
  findArbCandidates,
} from "../engine/universe/universe.builder";
import { discoverCurvePools } from "../integrations/curve/curve.discovery";
import { logInfo } from "../lib/logger";

function summarizeLadder(ladder: any) {
  return {
    type: ladder.type,
    bestOverall: ladder.bestOverall
      ? {
          size: ladder.bestOverall.size,
          pnlUsd: ladder.bestOverall.result.pnlUsd,
          pnlPct: ladder.bestOverall.result.pnlPct,
          health: ladder.bestOverall.health,
        }
      : null,
    bestHealthy: ladder.bestHealthy
      ? {
          size: ladder.bestHealthy.size,
          pnlUsd: ladder.bestHealthy.result.pnlUsd,
          pnlPct: ladder.bestHealthy.result.pnlPct,
          health: ladder.bestHealthy.health,
        }
      : null,
    curve: ladder.sizes.map((entry: any) => ({
      size: entry.size,
      pnlUsd: entry.result?.pnlUsd ?? null,
      pnlPct: entry.result?.pnlPct ?? null,
      health: entry.health,
      healthReasons: entry.healthReasons,
    })),
  };
}

export async function runScan(env: Env) {
  const config = getEnv(env);
  const sizeLadder = getDefaultSizeLadder();

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

  // 6. Size ladder analysis
  const baselineLadders = [];
  for (const path of baselinePaths) {
    baselineLadders.push(await simulatePathAcrossSizes(env, path, sizeLadder));
  }

  const arbLadders = [];
  for (const path of arbPaths) {
    arbLadders.push(await simulatePathAcrossSizes(env, path, sizeLadder));
  }

  const multiHopLadders = [];
  for (const path of multiHopPaths) {
    multiHopLadders.push(await simulatePathAcrossSizes(env, path, sizeLadder));
  }

  const bestBaselineLadders = baselineLadders
    .filter((entry) => entry.bestOverall?.result?.pnlUsd !== undefined)
    .sort(
      (a, b) =>
        (b.bestOverall?.result?.pnlUsd ?? -Infinity) -
        (a.bestOverall?.result?.pnlUsd ?? -Infinity)
    )
    .map(summarizeLadder);

  const bestArbLadders = arbLadders
    .filter((entry) => entry.bestOverall?.result?.pnlUsd !== undefined)
    .sort(
      (a, b) =>
        (b.bestOverall?.result?.pnlUsd ?? -Infinity) -
        (a.bestOverall?.result?.pnlUsd ?? -Infinity)
    )
    .map(summarizeLadder);

  const bestMultiHopLadders = multiHopLadders
    .filter((entry) => entry.bestOverall?.result?.pnlUsd !== undefined)
    .sort(
      (a, b) =>
        (b.bestOverall?.result?.pnlUsd ?? -Infinity) -
        (a.bestOverall?.result?.pnlUsd ?? -Infinity)
    )
    .map(summarizeLadder);

  // 7. Internal imbalance monitoring
  const imbalanceTargets = discoveredPools.filter((pool) => pool.isTwoCoinPool);

  const imbalanceReports = [];
  for (const pool of imbalanceTargets) {
    imbalanceReports.push(
      await monitorPoolImbalance({
        env,
        pool,
        quoteSizes: [1, 10, 100],
      })
    );
  }

  // 8. Executable opportunities from internal imbalance
  const internalCandidates = buildInternalImbalanceCandidates(imbalanceReports, 15);
  const internalExecutablePaths = buildExecutableInternalPaths({
    candidates: internalCandidates,
    discoveredPools,
  });

  const internalOpportunityEvaluations = await evaluateOpportunityPaths({
    env,
    candidates: internalCandidates,
    paths: internalExecutablePaths,
    sizeLadder,
  });

  const profitableInternalOpportunities = internalOpportunityEvaluations.filter(
    (entry) =>
      entry.bestHealthy &&
      typeof entry.bestHealthy.pnlUsd === "number" &&
      entry.bestHealthy.pnlUsd > config.minProfitUsd
  );

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

    sizeLadder: {
      testedSizes: sizeLadder,
      baseline: bestBaselineLadders,
      arbitrage: bestArbLadders,
      multiHop: bestMultiHopLadders,
    },

    imbalanceMonitoring: {
      totalTargets: imbalanceTargets.length,
      reports: imbalanceReports,
    },

    internalOpportunities: {
      totalCandidates: internalCandidates.length,
      totalExecutablePaths: internalExecutablePaths.length,
      profitableCount: profitableInternalOpportunities.length,
      profitable: profitableInternalOpportunities,
      evaluations: internalOpportunityEvaluations,
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
    imbalanceTargets: output.imbalanceMonitoring.totalTargets,
    internalCandidates: output.internalOpportunities.totalCandidates,
    internalExecutablePaths: output.internalOpportunities.totalExecutablePaths,
    profitableInternal: output.internalOpportunities.profitableCount,
  });

  return output;
}