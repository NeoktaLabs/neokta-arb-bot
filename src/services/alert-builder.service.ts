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

function formatPctFraction(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }

  return `${(value * 100).toFixed(4)}%`;
}

function formatRoute(entry: any): string {
  const legs = Array.isArray(entry?.legs) ? entry.legs : [];
  if (!legs.length) return entry?.key ?? "unknown";

  const parts = [legs[0].fromSymbol, ...legs.map((leg: any) => leg.toSymbol)].filter(Boolean);
  return parts.join(" → ");
}

function formatVenues(entry: any): string {
  const legs = Array.isArray(entry?.legs) ? entry.legs : [];
  const venues = Array.from(new Set(legs.map((leg: any) => String(leg?.venue ?? "unknown"))));
  return venues.join(" -> ");
}

function safeJsonLines(input: unknown): string {
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

export function buildAlertMessages(env: Env, scanResult: any): TelegramAlertMessage[] {
  const config = getEnv(env);
  const messages: TelegramAlertMessage[] = [];

  const profitableInternal = Array.isArray(scanResult?.internalOpportunities?.profitable)
    ? scanResult.internalOpportunities.profitable
    : [];

  const profitableBaseline = Array.isArray(scanResult?.baseline?.profitable)
    ? scanResult.baseline.profitable
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
      title:
        best.pnlUsd >= config.minConfidentProfitUsd
          ? "🟢 Profitable internal imbalance path"
          : "🟩 Small positive internal path",
      score: best.pnlUsd,
      body: [
        `Pool: ${candidate?.poolName ?? candidate?.poolAddress ?? "unknown"}`,
        `Direction: ${candidate?.direction ?? "unknown"}`,
        `Imbalance: ${formatPctFraction((candidate?.imbalancePct ?? 0) / 100)}`,
        `Best size: ${best.size ?? "n/a"} USDC`,
        `PnL: ${formatUsd(best.pnlUsd)}`,
        `PnL %: ${formatPctFraction(best.pnlPct)}`,
        `Health: ${best.health ?? "unknown"}`,
      ].join("\n"),
    });
  }

  for (const entry of profitableBaseline) {
    if (typeof entry?.pnlUsd !== "number") {
      continue;
    }

    messages.push({
      category: "profit",
      title:
        entry.pnlUsd >= config.minConfidentProfitUsd
          ? "🟢 Profitable cycle"
          : "🟩 Small positive cycle",
      score: entry.pnlUsd,
      body: [
        `Route: ${formatRoute(entry)}`,
        `Venues: ${formatVenues(entry)}`,
        `Path key: ${entry?.key ?? "unknown"}`,
        `Initial: ${entry?.initialAmount ?? "n/a"} USDC`,
        `Final: ${entry?.finalAmount ?? "n/a"} USDC`,
        `PnL: ${formatUsd(entry?.pnlUsd)}`,
        `PnL %: ${formatPctFraction(entry?.pnlPct)}`,
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
      title:
        entry.pnlUsd >= config.minConfidentProfitUsd
          ? "🟢 Profitable multi-hop cycle"
          : "🟩 Small positive multi-hop",
      score: entry.pnlUsd,
      body: [
        `Route: ${formatRoute(entry)}`,
        `Venues: ${formatVenues(entry)}`,
        `Path key: ${entry?.key ?? "unknown"}`,
        `Initial: ${entry?.initialAmount ?? "n/a"} USDC`,
        `Final: ${entry?.finalAmount ?? "n/a"} USDC`,
        `PnL: ${formatUsd(entry?.pnlUsd)}`,
        `PnL %: ${formatPctFraction(entry?.pnlPct)}`,
        `Health: ${entry?.health ?? "unknown"}`,
      ].join("\n"),
    });
  }

  if (config.enableNearMissAlerts) {
    const ladderGroups = [
      ...(Array.isArray(scanResult?.sizeLadder?.multiHop) ? scanResult.sizeLadder.multiHop : []),
      ...(Array.isArray(scanResult?.sizeLadder?.baseline) ? scanResult.sizeLadder.baseline : []),
    ];

    for (const ladder of ladderGroups) {
      const best = ladder?.bestHealthy ?? ladder?.bestOverall;

      if (!best || typeof best.pnlUsd !== "number") {
        continue;
      }

      if (best.pnlUsd >= config.minAlertProfitUsd) {
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
          `PnL %: ${formatPctFraction(best.pnlPct)}`,
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
        title: "🟠 Major Curve pool imbalance detected",
        score: report.imbalancePct,
        body: [
          `Pool: ${report?.poolName ?? report?.poolAddress ?? "unknown"}`,
          `Imbalance: ${report.imbalancePct.toFixed(2)}%`,
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
