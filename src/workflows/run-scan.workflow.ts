// src/workflows/run-scan.workflow.ts

import { getEnabledChains, getEnv } from "../config/env";
import type { ChainId } from "../domain/chains";
import type { ScanContext } from "../domain/scan-context.types";
import type { ScanReport } from "../domain/scan-report.types";
import type { Env } from "../domain/types";
import { getDefaultSizeLadder } from "../engine/sizing/size-ladder";
import { logError, logInfo } from "../lib/logger";
import { buildAlertMessages } from "../services/alert-builder.service";
import { sendTelegramAlerts } from "../services/alert.service";
import { runBaselineWorkflow } from "./run-baseline.workflow";
import { runDiscoveryWorkflow } from "./run-discovery.workflow";
import { runImbalanceWorkflow } from "./run-imbalance.workflow";
import { runInternalOpportunitiesWorkflow } from "./run-internal-opportunities.workflow";
import { runMultiHopWorkflow } from "./run-multihop.workflow";

function createScanId(): string { return `scan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

export function createScanContext(env: Env, chainId: ChainId = "etherlink"): ScanContext {
  return { scanId: createScanId(), startedAt: Date.now(), env, chainId, config: getEnv(env, chainId) };
}

export async function runScanWorkflow(env: Env, chainId: ChainId = "etherlink"): Promise<ScanReport> {
  return runFullScanWorkflow(createScanContext(env, chainId));
}

export async function runScheduledScans(env: Env): Promise<ScanReport[]> {
  const reports: ScanReport[] = [];
  for (const chainId of getEnabledChains(env)) {
    reports.push(await runScanWorkflow(env, chainId));
  }
  return reports;
}

export async function runFullScanWorkflow(context: ScanContext): Promise<ScanReport> {
  const startedAtIso = new Date(context.startedAt).toISOString();
  const sizeLadder = getDefaultSizeLadder(context.env);
  logInfo("scan.started", { scanId: context.scanId, chainId: context.chainId, initialUsdc: context.config.initialUsdc, okuEnabled: context.config.enableOku, uniswapEnabled: context.config.enableUniswap, alertMode: "profit_only" });
  try {
    const discovery = await runDiscoveryWorkflow(context);
    const baseline = await runBaselineWorkflow(context, discovery, sizeLadder);
    const multiHop = await runMultiHopWorkflow(context, discovery, sizeLadder);
    const imbalanceMonitoring = await runImbalanceWorkflow(context, discovery);
    const internalOpportunities = await runInternalOpportunitiesWorkflow(context, discovery, imbalanceMonitoring, sizeLadder);
    const draftReport = { scanId: context.scanId, chainId: context.chainId, startedAt: startedAtIso, completedAt: startedAtIso, durationMs: 0, totalConfiguredPools: discovery.routePools.length, venues: { curve: discovery.summary.curve, oku: discovery.summary.oku, uniswap: discovery.summary.uniswap }, discovery: discovery.summary, baseline, multiHop, sizeLadder: { testedSizes: sizeLadder, baseline: baseline.ladders, multiHop: multiHop.ladders }, imbalanceMonitoring, internalOpportunities, config: { initialUsdc: context.config.initialUsdc, minAlertProfitUsd: context.config.minAlertProfitUsd, minConfidentProfitUsd: context.config.minConfidentProfitUsd, imbalanceAlertThresholdPct: context.config.imbalanceAlertThresholdPct, okuEnabled: context.config.enableOku, uniswapEnabled: context.config.enableUniswap, alertMode: "profit_only" as const } };
    const alertMessages = buildAlertMessages(context.env, draftReport);
    const alertDelivery = await sendTelegramAlerts(context.env, alertMessages);
    const completedAt = Date.now();
    const report: ScanReport = { ...draftReport, completedAt: new Date(completedAt).toISOString(), durationMs: completedAt - context.startedAt, alerts: { prepared: alertMessages.length, messages: alertMessages, delivery: alertDelivery } };
    logInfo("scan.completed", { scanId: context.scanId, chainId: context.chainId, durationMs: report.durationMs, curvePools: report.venues.curve, okuPools: report.venues.oku, uniswapPools: report.venues.uniswap, baselinePaths: report.baseline.totalPaths, multiHopPaths: report.multiHop.totalPaths, profitableBaseline: report.baseline.profitableCount, profitableMultiHop: report.multiHop.profitableCount, profitableInternal: report.internalOpportunities.profitableCount });
    return report;
  } catch (error) {
    logError("scan.failed", { scanId: context.scanId, chainId: context.chainId, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}
