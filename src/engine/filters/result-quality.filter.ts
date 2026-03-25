// src/engine/filters/result-quality.filter.ts

export type SimulationHealth = "healthy" | "suspicious" | "unsupported";

export interface ClassifiedSimulation {
  health: SimulationHealth;
  reasons: string[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function classifySimulationResult(result: any): ClassifiedSimulation {
  const reasons: string[] = [];

  if (result?.error) {
    return {
      health: "unsupported",
      reasons: ["quote_reverted_or_pool_not_supported"],
    };
  }

  if (!isFiniteNumber(result?.initialAmount) || result.initialAmount <= 0) {
    return {
      health: "unsupported",
      reasons: ["invalid_initial_amount"],
    };
  }

  if (!isFiniteNumber(result?.finalAmount) || result.finalAmount <= 0) {
    return {
      health: "unsupported",
      reasons: ["invalid_final_amount"],
    };
  }

  if (!isFiniteNumber(result?.pnlUsd) || !isFiniteNumber(result?.pnlPct)) {
    return {
      health: "unsupported",
      reasons: ["invalid_pnl"],
    };
  }

  const initialAmount = result.initialAmount as number;
  const finalAmount = result.finalAmount as number;
  const pnlPct = result.pnlPct as number;
  const pair = String(result?.sharedTokenSymbol ?? result?.pair ?? "");

  // Same-pool round-trips should usually be slightly negative, not catastrophic.
  if (finalAmount < initialAmount * 0.5) {
    reasons.push("catastrophic_roundtrip_loss");
  }

  // Too-good-to-be-true same-pool result is suspicious.
  if (pnlPct > 0.01) {
    reasons.push("unexpected_positive_same_pool_roundtrip");
  }

  // Excessive loss beyond normal fees/slippage for a round trip.
  if (pnlPct < -0.05) {
    reasons.push("excessive_roundtrip_loss");
  }

  // Stable-ish symbols with huge loss are very suspicious.
  const upperPair = pair.toUpperCase();
  const looksStableLike =
    upperPair.includes("USD") || upperPair.includes("USDT") || upperPair.includes("USDC");

  if (looksStableLike && pnlPct < -0.02) {
    reasons.push("stable_like_pair_has_large_loss");
  }

  if (reasons.length > 0) {
    return {
      health: "suspicious",
      reasons,
    };
  }

  return {
    health: "healthy",
    reasons: [],
  };
}