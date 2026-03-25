// src/engine/opportunities/opportunity.types.ts

import type { Address } from "../../domain/types";

export interface OpportunityCandidate {
  key: string;
  poolAddress: Address;
  poolName: string;

  trigger: "internal_imbalance";
  direction: "token0_to_token1" | "token1_to_token0";

  token0Address: Address;
  token0Symbol: string;

  token1Address: Address;
  token1Symbol: string;

  imbalancePct: number;
  classification: "balanced" | "imbalanced" | "extreme";
}

export interface OpportunityEvaluation {
  candidate: OpportunityCandidate;
  bestOverall: {
    size: number;
    pnlUsd: number | null;
    pnlPct: number | null;
    health: string;
  } | null;
  bestHealthy: {
    size: number;
    pnlUsd: number | null;
    pnlPct: number | null;
    health: string;
  } | null;
  curve: {
    size: number;
    pnlUsd: number | null;
    pnlPct: number | null;
    health: string;
    healthReasons: string[];
  }[];
}