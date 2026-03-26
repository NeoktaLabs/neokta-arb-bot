// src/workflows/run-baseline.workflow.ts

import type { ScanContext } from "../domain/scan-context.types";
import type {
  ClassifiedSimulationResult,
  DiscoveryWorkflowReport,
  LadderSummaryView,
  SimulationWorkflowReport,
} from "../domain/scan-report.types";
import { classifySimulationResult } from "../engine/filters/result-quality.filter";
import { generatePaths } from "../engine/paths/path.generator";
import { simulatePath } from "../engine/paths/path.simulator";
import type { SuccessfulPathSimulation } from "../engine/simulation/simulation.types";
import { simulatePathAcrossSizes, type PathLadderSummary } from "../engine/sizing/size-ladder";
import { logInfo } from "../lib/logger";

function summarizeLadder(ladder: PathLadderSummary): LadderSummaryView {
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
    bestProfitable: ladder.bestProfitable
      ? {
          size: ladder.bestProfitable.size,
          pnlUsd: ladder.bestProfitable.result.pnlUsd,
          pnlPct: ladder.bestProfitable.result.pnlPct,
          health: ladder.bestProfitable.health,
        }
      : null,
    curve: ladder.sizes.map((entry) => ({
      size: entry.size,
      ok: entry.result.ok,
      pnlUsd: entry.result.ok ? entry.result.pnlUsd : null,
      pnlPct: entry.result.ok ? entry.result.pnlPct : null,
      health: entry.health,
      healthReasons: entry.healthReasons,
      error: entry.result.ok ? null : entry.result.error,
    })),
  };
}

async function simulatePathSet(context: ScanContext, paths: ReturnType<typeof generatePaths>): Promise<ClassifiedSimulationResult[]> {
  const results: ClassifiedSimulationResult[] = [];

  for (const path of paths) {
    const result = await simulatePath(context.env, path, context.config.initialUsdc);
    const classification = classifySimulationResult(result);
    results.push({
      result,
      health: classification.health,
      healthReasons: classification.reasons,
    });
  }

  return results;
}

function isProfitableResult(
  entry: ClassifiedSimulationResult,
  minimumAlertProfitUsd: number
): entry is ClassifiedSimulationResult & { result: SuccessfulPathSimulation } {
  return entry.result.ok && entry.result.pnlUsd > minimumAlertProfitUsd;
}

export async function runBaselineWorkflow(
  context: ScanContext,
  discovery: DiscoveryWorkflowReport,
  sizeLadder: number[]
): Promise<SimulationWorkflowReport> {
  const paths = generatePaths(discovery.usdcPools);
  const rawResults = await simulatePathSet(context, paths);

  const healthyResults = rawResults.filter((entry) => entry.health === "healthy");
  const suspiciousResults = rawResults.filter((entry) => entry.health === "suspicious");
  const unsupportedResults = rawResults.filter((entry) => entry.health === "unsupported");

  const profitable = healthyResults
    .filter((entry) => isProfitableResult(entry, context.config.minAlertProfitUsd))
    .map((entry) => entry.result)
    .sort((a, b) => b.pnlUsd - a.pnlUsd);

  const rawLadders: PathLadderSummary[] = [];
  for (const path of paths) {
    rawLadders.push(await simulatePathAcrossSizes(context.env, path, sizeLadder));
  }

  const ladders = rawLadders
    .filter((entry) => entry.bestOverall !== null)
    .sort((a, b) => (b.bestOverall?.result.pnlUsd ?? -Infinity) - (a.bestOverall?.result.pnlUsd ?? -Infinity))
    .map(summarizeLadder);

  logInfo("scan.baseline.completed", {
    scanId: context.scanId,
    totalPaths: paths.length,
    healthyCount: healthyResults.length,
    profitableCount: profitable.length,
  });

  return {
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
    ladders,
    rawLadders,
  };
}
