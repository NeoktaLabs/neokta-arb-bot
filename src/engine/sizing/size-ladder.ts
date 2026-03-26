// src/engine/sizing/size-ladder.ts

import { getEnv } from "../../config/env";
import type { Env } from "../../domain/types";
import { isProfitablePnl } from "../pnl/pnl.service";
import { classifySimulationResult } from "../filters/result-quality.filter";
import type { GeneratedPath } from "../paths/path.types";
import { simulatePath } from "../paths/path.simulator";
import type { PathSimulationResult, SuccessfulPathSimulation } from "../simulation/simulation.types";

export interface SizedSimulationResult {
  size: number;
  result: PathSimulationResult;
  health: "healthy" | "suspicious" | "unsupported";
  healthReasons: string[];
}

export interface ProfitableSizedSimulation {
  size: number;
  result: SuccessfulPathSimulation;
  health: "healthy" | "suspicious" | "unsupported";
  healthReasons: string[];
}

export interface PathLadderSummary {
  key: string;
  type: GeneratedPath["type"];
  sizes: SizedSimulationResult[];
  bestOverall: ProfitableSizedSimulation | null;
  bestHealthy: ProfitableSizedSimulation | null;
  bestProfitable: ProfitableSizedSimulation | null;
}

export function getDefaultSizeLadder(env?: Env): number[] {
  if (!env) {
    return [100, 1000];
  }

  const config = getEnv(env);
  return config.ladderSizes.length > 0 ? config.ladderSizes : [100, 1000];
}

export async function simulatePathAcrossSizes(
  env: Env,
  path: GeneratedPath,
  sizes: number[] = getDefaultSizeLadder(env)
): Promise<PathLadderSummary> {
  const ladderSizes = sizes.length > 0 ? sizes : getDefaultSizeLadder(env);
  const ladderResults: SizedSimulationResult[] = [];

  for (const size of ladderSizes) {
    const result = await simulatePath(env, path, size);
    const classification = classifySimulationResult(result);

    ladderResults.push({
      size,
      result,
      health: classification.health,
      healthReasons: classification.reasons,
    });
  }

  const successfulResults = ladderResults.filter(
    (entry): entry is SizedSimulationResult & { result: SuccessfulPathSimulation } => entry.result.ok
  );

  const healthyResults = successfulResults.filter((entry) => entry.health === "healthy");

  const profitableResults = healthyResults.filter((entry) => isProfitablePnl(entry.result.pnlUsd));

  const bestOverall =
    successfulResults.length > 0
      ? [...successfulResults].sort((a, b) => b.result.pnlUsd - a.result.pnlUsd)[0]
      : null;

  const bestHealthy =
    healthyResults.length > 0
      ? [...healthyResults].sort((a, b) => b.result.pnlUsd - a.result.pnlUsd)[0]
      : null;

  const bestProfitable =
    profitableResults.length > 0
      ? [...profitableResults].sort((a, b) => b.result.pnlUsd - a.result.pnlUsd)[0]
      : null;

  return {
    key: path.key,
    type: path.type,
    sizes: ladderResults,
    bestOverall,
    bestHealthy,
    bestProfitable,
  };
}