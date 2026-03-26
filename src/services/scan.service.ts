// src/services/scan.service.ts

import type { MarketPool } from "../domain/markets";
import type { Env } from "../domain/types";
import { getEnv } from "../config/env";
import { classifySimulationResult } from "../engine/filters/result-quality.filter";
import { buildTokenGraph } from "../engine/graph/graph.builder";
import { monitorPoolImbalance } from "../engine/imbalance/imbalance.monitor";
import {
  buildExecutableInternalPaths,
  buildInternalImbalanceCandidates,
} from "../engine/opportunities/opportunity.builder";
import { evaluateOpportunityPaths } from "../engine/opportunities/opportunity.evaluator";
import { generateMultiHopPaths } from "../engine/paths/multi-hop.generator";
import { generatePaths } from "../engine/paths/path.generator";
import { simulatePath } from "../engine/paths/path.simulator";
import { getDefaultSizeLadder, simulatePathAcrossSizes } from "../engine/sizing/size-ladder";
import { discoverCurvePools } from "../integrations/curve/curve.discovery";
import { discoverOkuPools } from "../integrations/oku/oku.discovery";
import { logInfo } from "../lib/logger";
import { buildAlertMessages } from "./alert-builder.service";
import { sendTelegramAlerts } from "./alert.service";

function summarizeLadder(ladder: any) {
  return {
    key: ladder.key,
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

function toMarketPools(curvePools: Awaited<ReturnType<typeof discoverCurvePools>>, okuPools: Awaited<ReturnType<typeof discoverOkuPools>>): MarketPool[] {
  const normalizedCurve: MarketPool[] = curvePools
    .filter((pool) => pool.isTwoCoinPool && pool.coins.length === 2)
    .map((pool) => ({
      venue: "curve" as const,
      address: pool.address,
      name: pool.name,
      tokens: [
        {
          address: pool.coins[0].address,
          symbol: pool.coins[0].symbol,
          decimals: pool.coins[0].decimals,
          index: pool.coins[0].index,
        },
        {
          address: pool.coins[1].address,
          symbol: pool.coins[1].symbol,
          decimals: pool.coins[1].decimals,
          index: pool.coins[1].index,
        },
      ],
      hasUsdc: pool.hasUsdc,
      usdcTokenAddress: pool.usdcCoinAddress,
    }));

  const normalizedOku: MarketPool[] = okuPools.map((pool) => ({
    venue: "oku" as const,
    address: pool.address,
    name: pool.name,
    tokens: [pool.token0, pool.token1],
    hasUsdc: pool.hasUsdc,
    usdcTokenAddress: pool.usdcTokenAddress,
    fee: pool.fee,
    metadata: {
      liquidity: pool.liquidity.toString(),
      tick: pool.tick,
    },
  }));

  return [...normalizedCurve, ...normalizedOku];
}

async function simulatePathSet(env: Env, paths: any[]) {
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

  const discoveredCurvePools = await discoverCurvePools(env);
  const discoveredOkuPools = config.enableOku ? await discoverOkuPools(env) : [];
  const marketPools = toMarketPools(discoveredCurvePools, discoveredOkuPools);

  const routePools = marketPools.filter((pool) => pool.tokens.length === 2);
  const usdcPools = routePools.filter((pool) => pool.hasUsdc);

  const baselinePaths = generatePaths(usdcPools);
  const baselineRawResults = await simulatePathSet(env, baselinePaths);

  const healthyBaselineResults = baselineRawResults.filter((result: any) => result.health === "healthy");
  const suspiciousBaselineResults = baselineRawResults.filter((result: any) => result.health === "suspicious");
  const unsupportedBaselineResults = baselineRawResults.filter((result: any) => result.health === "unsupported");

  const profitableBaselineResults = healthyBaselineResults
    .filter((result: any) => typeof result.pnlUsd === "number")
    .filter((result: any) => result.pnlUsd > config.minAlertProfitUsd)
    .sort((a: any, b: any) => b.pnlUsd - a.pnlUsd);

  const graph = buildTokenGraph(routePools);
  const multiHopPaths = generateMultiHopPaths(graph);
  const multiHopResults = await simulatePathSet(env, multiHopPaths);

  const healthyMultiHopResults = multiHopResults.filter((result: any) => result.health === "healthy");
  const suspiciousMultiHopResults = multiHopResults.filter((result: any) => result.health === "suspicious");
  const unsupportedMultiHopResults = multiHopResults.filter((result: any) => result.health === "unsupported");

  const profitableMultiHopResults = healthyMultiHopResults
    .filter((result: any) => typeof result.pnlUsd === "number")
    .filter((result: any) => result.pnlUsd > config.minAlertProfitUsd)
    .sort((a: any, b: any) => b.pnlUsd - a.pnlUsd);

  const baselineLadders = [];
  for (const path of baselinePaths) {
    baselineLadders.push(await simulatePathAcrossSizes(env, path, sizeLadder));
  }

  const multiHopLadders = [];
  for (const path of multiHopPaths) {
    multiHopLadders.push(await simulatePathAcrossSizes(env, path, sizeLadder));
  }

  const bestBaselineLadders = baselineLadders
    .filter((entry) => entry.bestOverall?.result?.pnlUsd !== undefined)
    .sort((a, b) => (b.bestOverall?.result?.pnlUsd ?? -Infinity) - (a.bestOverall?.result?.pnlUsd ?? -Infinity))
    .map(summarizeLadder);

  const bestMultiHopLadders = multiHopLadders
    .filter((entry) => entry.bestOverall?.result?.pnlUsd !== undefined)
    .sort((a, b) => (b.bestOverall?.result?.pnlUsd ?? -Infinity) - (a.bestOverall?.result?.pnlUsd ?? -Infinity))
    .map(summarizeLadder);

  const imbalanceTargets = discoveredCurvePools.filter((pool) => pool.isTwoCoinPool);
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

  const internalCandidates = buildInternalImbalanceCandidates(imbalanceReports, 15, discoveredCurvePools);
  const internalExecutablePaths = buildExecutableInternalPaths({
    candidates: internalCandidates,
    discoveredPools: discoveredCurvePools,
  });

  const rawInternalOpportunityEvaluations = await evaluateOpportunityPaths({
    env,
    candidates: internalCandidates,
    paths: internalExecutablePaths,
    sizeLadder,
  });

  const supportedInternalEvaluations = rawInternalOpportunityEvaluations.filter((entry) => !isUnsupportedEvaluation(entry));
  const unsupportedInternalEvaluations = rawInternalOpportunityEvaluations.filter((entry) => isUnsupportedEvaluation(entry));

  const profitableInternalOpportunities = supportedInternalEvaluations.filter(
    (entry) =>
      entry.bestHealthy &&
      typeof entry.bestHealthy.pnlUsd === "number" &&
      entry.bestHealthy.pnlUsd > config.minAlertProfitUsd
  );

  const output = {
    totalConfiguredPools: routePools.length,
    venues: {
      curve: discoveredCurvePools.length,
      oku: discoveredOkuPools.length,
    },

    baseline: {
      totalPaths: baselinePaths.length,
      totalSimulations: baselineRawResults.length,
      healthyCount: healthyBaselineResults.length,
      suspiciousCount: suspiciousBaselineResults.length,
      unsupportedCount: unsupportedBaselineResults.length,
      profitableCount: profitableBaselineResults.length,
      profitable: profitableBaselineResults,
      healthyResults: healthyBaselineResults,
      suspiciousResults: suspiciousBaselineResults,
      unsupportedResults: unsupportedBaselineResults,
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

    config: {
      initialUsdc: config.initialUsdc,
      minAlertProfitUsd: config.minAlertProfitUsd,
      minConfidentProfitUsd: config.minConfidentProfitUsd,
      imbalanceAlertThresholdPct: config.imbalanceAlertThresholdPct,
      okuEnabled: config.enableOku,
    },
  };

  const alertMessages = buildAlertMessages(env, output);
  const alertDelivery = await sendTelegramAlerts(env, alertMessages);

  logInfo("Scan result", {
    totalConfiguredPools: output.totalConfiguredPools,
    curvePools: output.venues.curve,
    okuPools: output.venues.oku,
    baselinePaths: output.baseline.totalPaths,
    multiHopPaths: output.multiHop.totalPaths,
    profitableBaseline: output.baseline.profitableCount,
    profitableMultiHop: output.multiHop.profitableCount,
    profitableInternal: output.internalOpportunities.profitableCount,
    preparedAlerts: alertMessages.length,
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
