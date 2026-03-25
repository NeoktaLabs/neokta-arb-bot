// src/engine/pnl/pnl.service.ts

export interface ProfitabilityConfig {
  minAlertProfitUsd: number;
  minConfidentProfitUsd: number;
  nearMissMinPnlUsd: number;
}

export type ProfitTier = "confident_profit" | "positive_profit" | "near_miss" | "not_interesting";

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function hasNumericPnl(input: { pnlUsd?: unknown } | null | undefined): input is { pnlUsd: number } {
  return isFiniteNumber(input?.pnlUsd);
}

export function isPositiveNetPnl(
  pnlUsd: number | null | undefined,
  config: Pick<ProfitabilityConfig, "minAlertProfitUsd">
): boolean {
  return isFiniteNumber(pnlUsd) && pnlUsd > config.minAlertProfitUsd;
}

export function isNearMissPnl(
  pnlUsd: number | null | undefined,
  config: Pick<ProfitabilityConfig, "minAlertProfitUsd" | "nearMissMinPnlUsd">
): boolean {
  return (
    isFiniteNumber(pnlUsd) &&
    pnlUsd <= config.minAlertProfitUsd &&
    pnlUsd >= config.nearMissMinPnlUsd
  );
}

export function getProfitTier(
  pnlUsd: number | null | undefined,
  config: ProfitabilityConfig
): ProfitTier {
  if (!isFiniteNumber(pnlUsd)) {
    return "not_interesting";
  }

  if (pnlUsd > config.minConfidentProfitUsd) {
    return "confident_profit";
  }

  if (pnlUsd > config.minAlertProfitUsd) {
    return "positive_profit";
  }

  if (isNearMissPnl(pnlUsd, config)) {
    return "near_miss";
  }

  return "not_interesting";
}
