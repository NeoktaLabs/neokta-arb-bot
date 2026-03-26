// src/engine/filters/result-quality.filter.ts

import type { PathSimulationResult, SuccessfulPathSimulation } from "../simulation/simulation.types";

export type SimulationHealth = "healthy" | "suspicious" | "unsupported";

export interface ClassifiedSimulation {
  health: SimulationHealth;
  reasons: string[];
}

function classifySuccessfulResult(result: SuccessfulPathSimulation): ClassifiedSimulation {
  const reasons: string[] = [];
  const initialAmount = result.initialAmount;
  const finalAmount = result.finalAmount;
  const pnlPct = result.pnlPct;
  const pair = String(result.sharedTokenSymbol ?? "");

  if (!Number.isFinite(initialAmount) || initialAmount <= 0) {
    return {
      health: "unsupported",
      reasons: ["invalid_initial_amount"],
    };
  }

  if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
    return {
      health: "unsupported",
      reasons: ["invalid_final_amount"],
    };
  }

  if (!Number.isFinite(result.pnlUsd) || !Number.isFinite(pnlPct)) {
    return {
      health: "unsupported",
      reasons: ["invalid_pnl"],
    };
  }

  if (finalAmount < initialAmount * 0.5) {
    reasons.push("catastrophic_roundtrip_loss");
  }

  if (pnlPct > 0.01) {
    reasons.push("unexpected_positive_same_pool_roundtrip");
  }

  if (pnlPct < -0.05) {
    reasons.push("excessive_roundtrip_loss");
  }

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

export function classifySimulationResult(result: PathSimulationResult): ClassifiedSimulation {
  if (!result.ok) {
    return {
      health: "unsupported",
      reasons: ["quote_reverted_or_pool_not_supported", result.error],
    };
  }

  return classifySuccessfulResult(result);
}
