// src/engine/sizing/size-ladder.ts

import type { Env } from "../../domain/types";
import { classifySimulationResult } from "../filters/result-quality.filter";
import type { GeneratedPath } from "../paths/path.types";
import { simulatePath } from "../paths/path.simulator";

export interface SizedSimulationResult {
  size: number;
  result: any;
  health: "healthy" | "suspicious" | "unsupported";
  healthReasons: string[];
}

export interface PathLadderSummary {
  key: string;
  type: string;
  sizes: SizedSimulationResult[];
  bestOverall: SizedSimulationResult | null;
  bestHealthy: SizedSimulationResult | null;
}

export function getDefaultSizeLadder(): number[] {
  return [1, 10, 100, 250, 500, 1000];
}

export async function simulatePathAcrossSizes(
  env: Env,
  path: GeneratedPath,
  sizes: number[]
): Promise<PathLadderSummary> {
  const ladderResults: SizedSimulationResult[] = [];

  for (const size of sizes) {
    const result = await simulatePath(env, path, size);
    const classification = classifySimulationResult(result);

    ladderResults.push({
      size,
      result,
      health: classification.health,
      healthReasons: classification.reasons,
    });
  }

  const resultsWithPnl = ladderResults.filter(
    (entry) => typeof entry.result?.pnlUsd === "number"
  );

  const healthyResults = resultsWithPnl.filter(
    (entry) => entry.health === "healthy"
  );

  const bestOverall =
    resultsWithPnl.length > 0
      ? [...resultsWithPnl].sort(
          (a, b) => (b.result.pnlUsd as number) - (a.result.pnlUsd as number)
        )[0]
      : null;

  const bestHealthy =
    healthyResults.length > 0
      ? [...healthyResults].sort(
          (a, b) => (b.result.pnlUsd as number) - (a.result.pnlUsd as number)
        )[0]
      : null;

  return {
    key: path.key,
    type: path.type,
    sizes: ladderResults,
    bestOverall,
    bestHealthy,
  };
}