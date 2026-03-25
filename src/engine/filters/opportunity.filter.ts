// src/engine/filters/opportunity.filter.ts

import { getProfitTier, hasNumericPnl, isPositiveNetPnl, type ProfitabilityConfig } from "../pnl/pnl.service";

interface RouteLikeResult {
  pnlUsd?: number | null;
  pnlPct?: number | null;
  health?: string;
}

interface LadderLikeEntry {
  size?: number;
  pnlUsd?: number | null;
  pnlPct?: number | null;
  health?: string;
}

interface OpportunityLikeEvaluation {
  bestOverall?: LadderLikeEntry | null;
  bestHealthy?: LadderLikeEntry | null;
}

export function filterPositiveRouteResults<T extends RouteLikeResult>(
  results: T[],
  config: Pick<ProfitabilityConfig, "minAlertProfitUsd">
): T[] {
  return results
    .filter((result) => result.health === "healthy")
    .filter((result) => isPositiveNetPnl(result.pnlUsd, config))
    .sort((a, b) => (b.pnlUsd ?? -Infinity) - (a.pnlUsd ?? -Infinity));
}

export function filterPositiveOpportunityEvaluations<T extends OpportunityLikeEvaluation>(
  evaluations: T[],
  config: Pick<ProfitabilityConfig, "minAlertProfitUsd">
): T[] {
  return evaluations
    .filter((entry) => hasNumericPnl(entry.bestHealthy) && isPositiveNetPnl(entry.bestHealthy.pnlUsd, config))
    .sort((a, b) => {
      const aPnl = a.bestHealthy?.pnlUsd ?? -Infinity;
      const bPnl = b.bestHealthy?.pnlUsd ?? -Infinity;
      return bPnl - aPnl;
    });
}

export function selectBestAlertCandidate<T extends OpportunityLikeEvaluation>(
  entry: T
): LadderLikeEntry | null {
  if (entry.bestHealthy && hasNumericPnl(entry.bestHealthy)) {
    return entry.bestHealthy;
  }

  if (entry.bestOverall && hasNumericPnl(entry.bestOverall)) {
    return entry.bestOverall;
  }

  return null;
}

export function getAlertPriorityScore(
  pnlUsd: number | null | undefined,
  config: ProfitabilityConfig
): number {
  const tier = getProfitTier(pnlUsd, config);

  switch (tier) {
    case "confident_profit":
      return 3;
    case "positive_profit":
      return 2;
    case "near_miss":
      return 1;
    default:
      return 0;
  }
}
