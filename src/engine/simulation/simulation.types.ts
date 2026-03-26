// src/engine/simulation/simulation.types.ts

import type { GeneratedPath } from "../paths/path.types";
import type { VenueId } from "../../domain/markets";

export interface SimulationStepResult {
  venue: VenueId;
  poolName: string;
  poolAddress: `0x${string}`;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amountIn: number;
  amountOut: number;
}

export interface PathSimulationBase {
  key: GeneratedPath["key"];
  type: GeneratedPath["type"];
  sharedTokenSymbol: GeneratedPath["sharedTokenSymbol"];
  initialAmount: number;
}

export interface SuccessfulPathSimulation extends PathSimulationBase {
  ok: true;
  finalAmount: number;
  pnlUsd: number;
  pnlPct: number;
  legs: SimulationStepResult[];
}

export interface FailedPathSimulation extends PathSimulationBase {
  ok: false;
  error: string;
  failedAtStep: number | null;
  legs: Omit<SimulationStepResult, "amountIn" | "amountOut">[];
}

export type PathSimulationResult = SuccessfulPathSimulation | FailedPathSimulation;
