// src/workflows/run-internal-opportunities.workflow.ts

import type { ScanContext } from "../domain/scan-context.types";
import type {
  DiscoveryWorkflowReport,
  ImbalanceWorkflowReport,
  InternalOpportunityWorkflowReport,
} from "../domain/scan-report.types";
import {
  buildExecutableInternalPaths,
  buildInternalImbalanceCandidates,
} from "../engine/opportunities/opportunity.builder";
import { evaluateOpportunityPaths } from "../engine/opportunities/opportunity.evaluator";
import { logInfo } from "../lib/logger";

function isUnsupportedEvaluation(entry: any): boolean {
  if (!Array.isArray(entry?.curve) || entry.curve.length === 0) {
    return true;
  }

  return entry.curve.every((point: any) => point.health === "unsupported");
}

export async function runInternalOpportunitiesWorkflow(
  context: ScanContext,
  discovery: DiscoveryWorkflowReport,
  imbalance: ImbalanceWorkflowReport,
  sizeLadder: number[]
): Promise<InternalOpportunityWorkflowReport> {
  const candidates = buildInternalImbalanceCandidates(
    imbalance.reports as any[],
    15,
    discovery.curvePools as any[]
  );

  const paths = buildExecutableInternalPaths({
    candidates,
    discoveredPools: discovery.curvePools as any[],
  });

  const rawEvaluations = await evaluateOpportunityPaths({
    env: context.env,
    candidates,
    paths,
    sizeLadder,
  });

  const supportedEvaluations = rawEvaluations.filter((entry) => !isUnsupportedEvaluation(entry));
  const unsupportedEvaluations = rawEvaluations.filter((entry) => isUnsupportedEvaluation(entry));
  const profitable = supportedEvaluations.filter(
    (entry) => entry.bestProfitable !== null && entry.bestProfitable.pnlUsd > context.config.minAlertProfitUsd
  );

  logInfo("scan.internal.completed", {
    scanId: context.scanId,
    totalCandidates: candidates.length,
    totalExecutablePaths: paths.length,
    profitableCount: profitable.length,
  });

  return {
    totalCandidates: candidates.length,
    totalExecutablePaths: paths.length,
    supportedCount: supportedEvaluations.length,
    unsupportedCount: unsupportedEvaluations.length,
    profitableCount: profitable.length,
    profitable,
    supportedEvaluations,
    unsupportedEvaluations,
  };
}
