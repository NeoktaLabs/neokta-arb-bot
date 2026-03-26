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

function formatRoute(entry: { legs?: Array<{ fromSymbol?: string; toSymbol?: string }> ; key?: string }): string {
  const legs = Array.isArray(entry.legs) ? entry.legs : [];
  if (!legs.length) return entry.key ?? "unknown";

  const parts = [legs[0].fromSymbol, ...legs.map((leg) => leg.toSymbol)].filter(Boolean);
  return parts.join(" → ");
}

function formatVenues(entry: { legs?: Array<{ venue?: string }> }): string {
  const legs = Array.isArray(entry.legs) ? entry.legs : [];
  const venues = Array.from(new Set(legs.map((leg) => String(leg?.venue ?? "unknown"))));
  return venues.join(" -> ");
}

export function buildAlertMessages(env: Env, scanResult: any): TelegramAlertMessage[] {
  const config = getEnv(env);
  const minimumAlertProfit = Math.max(0, config.minAlertProfitUsd);
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

  for (const entry of profitableInternal) {
    const best = entry?.bestProfitable ?? entry?.bestHealthy ?? entry?.bestOverall;
    const candidate = entry?.candidate;

    if (!best || typeof best.pnlUsd !== "number" || best.pnlUsd <= minimumAlertProfit) {
      continue;
    }

    messages.push({
      category: "profit",
      title: "🟢 Profitable internal path",
      score: best.pnlUsd,
      body: [
        `Pool: ${candidate?.poolName ?? candidate?.poolAddress ?? "unknown"}`,
        `Direction: ${candidate?.direction ?? "unknown"}`,
        `Best size: ${best.size ?? "n/a"} USDC`,
        `PnL: ${formatUsd(best.pnlUsd)}`,
        `PnL %: ${formatPctFraction(best.pnlPct)}`,
      ].join("\n"),
    });
  }

  for (const entry of profitableBaseline) {
    if (typeof entry?.pnlUsd !== "number" || entry.pnlUsd <= minimumAlertProfit) {
      continue;
    }

    messages.push({
      category: "profit",
      title: "🟢 Profitable cycle",
      score: entry.pnlUsd,
      body: [
        `Route: ${formatRoute(entry)}`,
        `Venues: ${formatVenues(entry)}`,
        `Path key: ${entry?.key ?? "unknown"}`,
        `Input: ${entry?.initialAmount ?? "n/a"} USDC`,
        `Output: ${entry?.finalAmount ?? "n/a"} USDC`,
        `PnL: ${formatUsd(entry?.pnlUsd)}`,
        `PnL %: ${formatPctFraction(entry?.pnlPct)}`,
      ].join("\n"),
    });
  }

  for (const entry of profitableMultiHop) {
    if (typeof entry?.pnlUsd !== "number" || entry.pnlUsd <= minimumAlertProfit) {
      continue;
    }

    messages.push({
      category: "profit",
      title: "🟢 Profitable multi-hop cycle",
      score: entry.pnlUsd,
      body: [
        `Route: ${formatRoute(entry)}`,
        `Venues: ${formatVenues(entry)}`,
        `Path key: ${entry?.key ?? "unknown"}`,
        `Input: ${entry?.initialAmount ?? "n/a"} USDC`,
        `Output: ${entry?.finalAmount ?? "n/a"} USDC`,
        `PnL: ${formatUsd(entry?.pnlUsd)}`,
        `PnL %: ${formatPctFraction(entry?.pnlPct)}`,
      ].join("\n"),
    });
  }

  messages.sort((a, b) => b.score - a.score);
  return messages.slice(0, config.maxAlertsPerScan);
}
