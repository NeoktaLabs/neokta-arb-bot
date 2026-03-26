// src/workflows/run-imbalance.workflow.ts

import type { ScanContext } from "../domain/scan-context.types";
import type { DiscoveryWorkflowReport, ImbalanceWorkflowReport } from "../domain/scan-report.types";
import { monitorPoolImbalance } from "../engine/imbalance/imbalance.monitor";
import { logInfo } from "../lib/logger";

export async function runImbalanceWorkflow(
  context: ScanContext,
  discovery: DiscoveryWorkflowReport
): Promise<ImbalanceWorkflowReport> {
  const imbalanceTargets = discovery.curvePools.filter((pool: any) => pool.isTwoCoinPool);
  const reports = [];

  for (const pool of imbalanceTargets as any[]) {
    reports.push(
      await monitorPoolImbalance({
        env: context.env,
        pool,
        quoteSizes: [1, 10, 100],
      })
    );
  }

  logInfo("scan.imbalance.completed", {
    scanId: context.scanId,
    totalTargets: imbalanceTargets.length,
    reportCount: reports.length,
  });

  return {
    totalTargets: imbalanceTargets.length,
    reports,
  };
}
