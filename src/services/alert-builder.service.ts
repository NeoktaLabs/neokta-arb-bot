// src/services/alert-builder.service.ts

import { getEnv } from "../config/env";
import type { Env } from "../domain/types";
import type { TelegramAlertMessage } from "./alert.service";

function formatUsd(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }

  return `${value.toFixed(4)} USDC`;
}

function formatPct(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }

  return `${value.toFixed(4)}%`;
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
    const best = entry?.bestHealthy ?? entry?.bestOverall;
    const candidate = entry?.candidate;

    if (!best || typeof best.pnlUsd !== "number") {
      continue;
    }

    messages.push({
      category: "profit",
      title: "🟢 Profitable internal imbalance path",
      score: best.pnlUsd,
      body: [
        `Pool: ${candidate?.poolName ?? candidate?.poolAddress ?? "unknown"}`,
        `Direction: ${candidate?.direction ?? "unknown"}`,
        `Imbalance: ${formatPct(candidate?.imbalancePct)}`,
        `Best size: ${best.size ?? "n/a"} USDC`,
        `PnL: ${formatUsd(best.pnlUsd)}`,
        `PnL %: ${formatPct(best.pnlPct)}`,
        `Health: ${best.health ?? "unknown"}`,
      ].join("\n"),
    });
  }

  for (const entry of profitableArb) {
    if (typeof entry?.pnlUsd !== "number") {
      continue;
    }

    messages.push({
      category: "profit",
      title: "🟢 Profitable cross-pool cycle",
      score: entry.pnlUsd,
      body: [
        `Path key: ${entry?.key ?? "unknown"}`,
        `Initial: ${entry?.initialAmount ?? "n/a"} USDC`,
        `Final: ${entry?.finalAmount ?? "n/a"} USDC`,
        `PnL: ${formatUsd(entry?.pnlUsd)}`,
        `PnL %: ${formatPct(entry?.pnlPct)}`,
        `Health: ${entry?.health ?? "unknown"}`,
      ].join("\n"),
    });
  }

  for (const entry of profitableMultiHop) {
    if (typeof entry?.pnlUsd !== "number") {
      continue;
    }

    messages.push({
      category: "profit",
      title: "🟢 Profitable multi-hop cycle",
      score: entry.pnlUsd,
      body: [
        `Path key: ${entry?.key ?? "unknown"}`,
        `Initial: ${entry?.initialAmount ?? "n/a"} USDC`,
        `Final: ${entry?.finalAmount ?? "n/a"} USDC`,
        `PnL: ${formatUsd(entry?.pnlUsd)}`,
        `PnL %: ${formatPct(entry?.pnlPct)}`,
        `Health: ${entry?.health ?? "unknown"}`,
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

      if (best.pnlUsd >= config.minProfitUsd) {
        continue;
      }

      if (best.pnlUsd < config.nearMissMinPnlUsd) {
        continue;
      }

      messages.push({
        category: "near_miss",
        title: "🟡 Near-miss route worth watching",
        score: best.pnlUsd,
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
          `Imbalance: ${formatPct(report?.imbalancePct)}`,
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