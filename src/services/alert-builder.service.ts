// src/services/alert-builder.service.ts

import { getEnv } from "../config/env";
import type { Env } from "../domain/types";
import {
  getAlertPriorityScore,
  selectBestAlertCandidate,
} from "../engine/filters/opportunity.filter";
import { getProfitTier, isNearMissPnl } from "../engine/pnl/pnl.service";
import type { TelegramAlertMessage } from "./alert.service";

function formatUsd(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }

  return `${value.toFixed(6)} USDC`;
}

function formatPct(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }

  return `${(value * 100).toFixed(4)}%`;
}

function safeJsonLines(input: unknown): string {
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

export function buildAlertMessages(
  env: Env,
  scanResult: any
): TelegramAlertMessage[] {
  const config = getEnv(env);
  const messages: TelegramAlertMessage[] = [];

  const profitableInternal = Array.isArray(scanResult?.internalOpportunities?.profitable)
    ? scanResult.internalOpportunities.profitable
    : [];

  const profitableArb = Array.isArray(scanResult?.arbitrage?.profitable)
    ? scanResult.arbitrage.profitable
    : [];

  const profitableMultiHop = Array.isArray(scanResult?.multiHop?.profitable)
    ? scanResult.multiHop.profitable
    : [];

  const imbalanceReports = Array.isArray(scanResult?.imbalanceMonitoring?.reports)
    ? scanResult.imbalanceMonitoring.reports
    : [];

  for (const entry of profitableInternal) {
    const best = selectBestAlertCandidate(entry);
    const candidate = entry?.candidate;

    if (!best || typeof best.pnlUsd !== "number") {
      continue;
    }

    const tier = getProfitTier(best.pnlUsd, config);
    const titlePrefix = tier === "confident_profit" ? "🟢" : "🟩";

    messages.push({
      category: "profit",
      title: `${titlePrefix} Positive internal imbalance path`,
      score: best.pnlUsd + getAlertPriorityScore(best.pnlUsd, config),
      body: [
        `Pool: ${candidate?.poolName ?? candidate?.poolAddress ?? "unknown"}`,
        `Direction: ${candidate?.direction ?? "unknown"}`,
        `Imbalance: ${typeof candidate?.imbalancePct === "number" ? candidate.imbalancePct.toFixed(4) : "n/a"}%`,
        `Best size: ${best.size ?? "n/a"} USDC`,
        `PnL: ${formatUsd(best.pnlUsd)}`,
        `PnL %: ${formatPct(best.pnlPct)}`,
        `Health: ${best.health ?? "unknown"}`,
        `Tier: ${tier}`,
      ].join("\n"),
    });
  }

  for (const entry of profitableArb) {
    if (typeof entry?.pnlUsd !== "number") {
      continue;
    }

    const tier = getProfitTier(entry.pnlUsd, config);
    const titlePrefix = tier === "confident_profit" ? "🟢" : "🟩";

    messages.push({
      category: "profit",
      title: `${titlePrefix} Positive cross-pool cycle`,
      score: entry.pnlUsd + getAlertPriorityScore(entry.pnlUsd, config),
      body: [
        `Path key: ${entry?.key ?? "unknown"}`,
        `Initial: ${entry?.initialAmount ?? "n/a"} USDC`,
        `Final: ${entry?.finalAmount ?? "n/a"} USDC`,
        `PnL: ${formatUsd(entry?.pnlUsd)}`,
        `PnL %: ${formatPct(entry?.pnlPct)}`,
        `Health: ${entry?.health ?? "unknown"}`,
        `Tier: ${tier}`,
      ].join("\n"),
    });
  }

  for (const entry of profitableMultiHop) {
    if (typeof entry?.pnlUsd !== "number") {
      continue;
    }

    const tier = getProfitTier(entry.pnlUsd, config);
    const titlePrefix = tier === "confident_profit" ? "🟢" : "🟩";

    messages.push({
      category: "profit",
      title: `${titlePrefix} Positive multi-hop cycle`,
      score: entry.pnlUsd + getAlertPriorityScore(entry.pnlUsd, config),
      body: [
        `Path key: ${entry?.key ?? "unknown"}`,
        `Initial: ${entry?.initialAmount ?? "n/a"} USDC`,
        `Final: ${entry?.finalAmount ?? "n/a"} USDC`,
        `PnL: ${formatUsd(entry?.pnlUsd)}`,
        `PnL %: ${formatPct(entry?.pnlPct)}`,
        `Health: ${entry?.health ?? "unknown"}`,
        `Tier: ${tier}`,
      ].join("\n"),
    });
  }

  if (config.enableNearMissAlerts) {
    const ladderGroups = [
      ...(Array.isArray(scanResult?.sizeLadder?.arbitrage) ? scanResult.sizeLadder.arbitrage : []),
      ...(Array.isArray(scanResult?.sizeLadder?.multiHop) ? scanResult.sizeLadder.multiHop : []),
      ...(Array.isArray(scanResult?.sizeLadder?.baseline) ? scanResult.sizeLadder.baseline : []),
    ];

    for (const ladder of ladderGroups) {
      const best = ladder?.bestHealthy ?? ladder?.bestOverall;

      if (!best || typeof best.pnlUsd !== "number") {
        continue;
      }

      if (!isNearMissPnl(best.pnlUsd, config)) {
        continue;
      }

      messages.push({
        category: "near_miss",
        title: "🟡 Near-miss route worth watching",
        score: best.pnlUsd + getAlertPriorityScore(best.pnlUsd, config),
        body: [
          `Type: ${ladder?.type ?? "unknown"}`,
          `Best size: ${best.size ?? "n/a"} USDC`,
          `PnL: ${formatUsd(best.pnlUsd)}`,
          `PnL %: ${formatPct(best.pnlPct)}`,
          `Health: ${best.health ?? "unknown"}`,
        ].join("\n"),
      });
    }
  }

  if (config.enableImbalanceAlerts) {
    for (const report of imbalanceReports) {
      if (typeof report?.imbalancePct !== "number") {
        continue;
      }

      if (report.imbalancePct < config.imbalanceAlertThresholdPct) {
        continue;
      }

      messages.push({
        category: "imbalance",
        title: "🟠 Major pool imbalance detected",
        score: report.imbalancePct,
        body: [
          `Pool: ${report?.poolName ?? report?.poolAddress ?? "unknown"}`,
          `Imbalance: ${typeof report?.imbalancePct === "number" ? report.imbalancePct.toFixed(4) : "n/a"}%`,
          `Classification: ${report?.classification ?? "unknown"}`,
          `Details:`,
          safeJsonLines({
            quotes: report?.quotes ?? [],
          }),
        ].join("\n"),
      });
    }
  }

  messages.sort((a, b) => b.score - a.score);

  return messages.slice(0, config.maxAlertsPerScan);
}
