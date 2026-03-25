// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { getEnv } from "../config/env";
import {
  filterPositiveOpportunityEvaluations,
  filterPositiveRouteResults,
} from "../engine/filters/opportunity.filter";
import { buildPoolHealthSummaries } from "../engine/filters/pool-quality.filter";
import { classifySimulationResult } from "../engine/filters/result-quality.filter";
import { buildTokenGraph } from "../engine/graph/graph.builder";
import { monitorPoolImbalance } from "../engine/imbalance/imbalance.monitor";
import {
  buildExecutableInternalPaths,
  buildInternalImbalanceCandidates,
} from "../engine/opportunities/opportunity.builder";
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
import { buildAlertMessages } from "./alert-builder.service";
import { sendTelegramAlerts } from "./alert.service";

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
    bestPositive: ladder.bestPositive
      ? {
          size: ladder.bestPositive.size,
          pnlUsd: ladder.bestPositive.result.pnlUsd,
          pnlPct: ladder.bestPositive.result.pnlPct,
          health: ladder.bestPositive.health,
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

function isUnsupportedEvaluation(entry: any): boolean {
  if (!Array.isArray(entry?.curve) || entry.curve.length === 0) {
    return true;
  }

  return entry.curve.every((point: any) => point.health === "unsupported");
}

async function simulateAndClassifyPaths(env: Env, paths: any[]) {
  const results = [];

  for (const path of paths) {
    const simulation = await simulatePath(env, path, getEnv(env).initialUsdc);
    const classification = classifySimulationResult(simulation);

    results.push({
      ...simulation,
      health: classification.health,
      healthReasons: classification.reasons,
    });
  }

  return results;
}

export async function runScan(env: Env) {
  const config = getEnv(env);
  const sizeLadder = getDefaultSizeLadder();

  const discoveredPools = await discoverCurvePools(env);

  const twoCoinPools = discoveredPools.filter((pool) => pool.isTwoCoinPool);
  const usdcPools = twoCoinPools.filter((pool) => pool.hasUsdc);

  const baselinePaths = generatePaths(usdcPools);
  const baselineRawResults = await simulateAndClassifyPaths(env, baselinePaths);

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

  const trustedPools = buildTrustedPools(discoveredPools, poolHealth);
  const tokenClusters = buildTokenClusters(trustedPools);
  const arbCandidates = findArbCandidates(tokenClusters);

  const arbPaths = generateArbPaths(arbCandidates);
  const arbResults = await simulateAndClassifyPaths(env, arbPaths);

  const healthyArbResults = arbResults.filter((result: any) => result.health === "healthy");
  const suspiciousArbResults = arbResults.filter((result: any) => result.health === "suspicious");
  const unsupportedArbResults = arbResults.filter((result: any) => result.health === "unsupported");

  const profitableArbResults = filterPositiveRouteResults(healthyArbResults, config);

  const graph = buildTokenGraph(discoveredPools);
  const multiHopPaths = generateMultiHopPaths(graph);
  const multiHopResults = await simulateAndClassifyPaths(env, multiHopPaths);

  const healthyMultiHopResults = multiHopResults.filter(
    (result: any) => result.health === "healthy"
  );
  const suspiciousMultiHopResults = multiHopResults.filter(
    (result: any) => result.health === "suspicious"
  );
  const unsupportedMultiHopResults = multiHopResults.filter(
    (result: any) => result.health === "unsupported"
  );

  const profitableMultiHopResults = filterPositiveRouteResults(healthyMultiHopResults, config);

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

  const internalCandidates = buildInternalImbalanceCandidates(
    imbalanceReports,
    15,
    discoveredPools
  );

  const internalExecutablePaths = buildExecutableInternalPaths({
    candidates: internalCandidates,
    discoveredPools,
  });

  const rawInternalOpportunityEvaluations = await evaluateOpportunityPaths({
    env,
    candidates: internalCandidates,
    paths: internalExecutablePaths,
    sizeLadder,
  });

  const supportedInternalEvaluations = rawInternalOpportunityEvaluations.filter(
    (entry) => !isUnsupportedEvaluation(entry)
  );

  const unsupportedInternalEvaluations = rawInternalOpportunityEvaluations.filter(
    (entry) => isUnsupportedEvaluation(entry)
  );

  const profitableInternalOpportunities = filterPositiveOpportunityEvaluations(
    supportedInternalEvaluations,
    config
  );

  const output = {
    totalConfiguredPools: discoveredPools.length,
    totalTwoCoinPools: twoCoinPools.length,
    totalUsdcTwoCoinPools: usdcPools.length,

    config: {
      initialUsdc: config.initialUsdc,
      minAlertProfitUsd: config.minAlertProfitUsd,
      minConfidentProfitUsd: config.minConfidentProfitUsd,
      nearMissMinPnlUsd: config.nearMissMinPnlUsd,
    },

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
      supportedCount: supportedInternalEvaluations.length,
      unsupportedCount: unsupportedInternalEvaluations.length,
      profitableCount: profitableInternalOpportunities.length,
      profitable: profitableInternalOpportunities,
      supportedEvaluations: supportedInternalEvaluations,
      unsupportedEvaluations: unsupportedInternalEvaluations,
    },
  };

  const alertMessages = buildAlertMessages(env, output);
  const alertDelivery = await sendTelegramAlerts(env, alertMessages);

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
    supportedInternal: output.internalOpportunities.supportedCount,
    profitableInternal: output.internalOpportunities.profitableCount,
    preparedAlerts: alertMessages.length,
    minAlertProfitUsd: config.minAlertProfitUsd,
    telegramEnabled: alertDelivery.enabled,
    telegramSent: alertDelivery.sent,
  });

  return {
    ...output,
    alerts: {
      prepared: alertMessages.length,
      messages: alertMessages,
      delivery: alertDelivery,
    },
  };
}
