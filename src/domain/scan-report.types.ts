// src/domain/scan-report.types.ts

import type { ChainId } from "./chains";
import type { MarketPool } from "./markets";
import type { PathSimulationResult } from "../engine/simulation/simulation.types";
import type { PathLadderSummary } from "../engine/sizing/size-ladder";
import type { TelegramAlertMessage } from "../services/alert.service";
import type { OpportunityEvaluation } from "../engine/opportunities/opportunity.types";

export interface DiscoveryWorkflowReport {
  curvePools: unknown[];
  okuPools: unknown[];
  uniswapPools: unknown[];
  marketPools: MarketPool[];
  routePools: MarketPool[];
  usdcPools: MarketPool[];
  summary: {
    curve: number;
    oku: number;
    uniswap: number;
    total: number;
    usdcAnchored: number;
  };
}

export type SimulationHealth = "healthy" | "suspicious" | "unsupported";

export interface ClassifiedSimulationResult {
  health: SimulationHealth;
  healthReasons: string[];
  result: PathSimulationResult;
}

export interface LadderSummaryView {
  key: string;
  type: string;
  bestOverall: {
    size: number;
    pnlUsd: number;
    pnlPct: number;
    health: SimulationHealth;
  } | null;
  bestHealthy: {
    size: number;
    pnlUsd: number;
    pnlPct: number;
    health: SimulationHealth;
  } | null;
  bestProfitable: {
    size: number;
    pnlUsd: number;
    pnlPct: number;
    health: SimulationHealth;
  } | null;
  curve: Array<{
    size: number;
    ok: boolean;
    pnlUsd: number | null;
    pnlPct: number | null;
    health: SimulationHealth;
    healthReasons: string[];
    error: string | null;
  }>;
}

export interface SimulationWorkflowReport {
  totalPaths: number;
  totalSimulations: number;
  healthyCount: number;
  suspiciousCount: number;
  unsupportedCount: number;
  profitableCount: number;
  profitable: PathSimulationResult[];
  healthyResults: ClassifiedSimulationResult[];
  suspiciousResults: ClassifiedSimulationResult[];
  unsupportedResults: ClassifiedSimulationResult[];
  ladders: LadderSummaryView[];
  rawLadders?: PathLadderSummary[];
}

export interface ImbalanceWorkflowReport {
  totalTargets: number;
  reports: unknown[];
}

export interface InternalOpportunityWorkflowReport {
  totalCandidates: number;
  totalExecutablePaths: number;
  supportedCount: number;
  unsupportedCount: number;
  profitableCount: number;
  profitable: OpportunityEvaluation[];
  supportedEvaluations: OpportunityEvaluation[];
  unsupportedEvaluations: OpportunityEvaluation[];
}

export interface AlertDeliveryReport {
  enabled: boolean;
  attempted: number;
  sent: number;
}

export interface AlertPlanReport {
  prepared: number;
  messages: TelegramAlertMessage[];
  delivery: AlertDeliveryReport;
}

export interface ScanReport {
  scanId: string;
  chainId: ChainId;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  totalConfiguredPools: number;
  venues: {
    curve: number;
    oku: number;
    uniswap: number;
  };
  discovery: DiscoveryWorkflowReport["summary"];
  baseline: SimulationWorkflowReport;
  multiHop: SimulationWorkflowReport;
  sizeLadder: {
    testedSizes: number[];
    baseline: LadderSummaryView[];
    multiHop: LadderSummaryView[];
  };
  imbalanceMonitoring: ImbalanceWorkflowReport;
  internalOpportunities: InternalOpportunityWorkflowReport;
  config: {
    initialUsdc: number;
    minAlertProfitUsd: number;
    minConfidentProfitUsd: number;
    imbalanceAlertThresholdPct: number;
    okuEnabled: boolean;
    uniswapEnabled: boolean;
    alertMode: "profit_only";
  };
  alerts: AlertPlanReport;
}
