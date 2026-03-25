// src/engine/opportunities/opportunity.evaluator.ts

import type { Env } from "../../domain/types";
import { getDefaultSizeLadder, simulatePathAcrossSizes } from "../sizing/size-ladder";
import type { GeneratedPath } from "../paths/path.types";
import type { OpportunityCandidate, OpportunityEvaluation } from "./opportunity.types";

export async function evaluateOpportunityPaths(args: {
  env: Env;
  candidates: OpportunityCandidate[];
  paths: GeneratedPath[];
  sizeLadder?: number[];
}): Promise<OpportunityEvaluation[]> {
  const sizes = args.sizeLadder ?? getDefaultSizeLadder();

  const candidateMap = new Map<string, OpportunityCandidate>();
  for (const candidate of args.candidates) {
    candidateMap.set(candidate.key, candidate);
  }

  const evaluations: OpportunityEvaluation[] = [];

  for (const path of args.paths) {
    const candidateKeyParts = path.key.split(":").slice(0, 3).join(":");
    const candidate = candidateMap.get(candidateKeyParts);

    if (!candidate) continue;

    const ladder = await simulatePathAcrossSizes(args.env, path, sizes);

    evaluations.push({
      candidate,
      bestOverall: ladder.bestOverall
        ? {
            size: ladder.bestOverall.size,
            pnlUsd:
              typeof ladder.bestOverall.result?.pnlUsd === "number"
                ? ladder.bestOverall.result.pnlUsd
                : null,
            pnlPct:
              typeof ladder.bestOverall.result?.pnlPct === "number"
                ? ladder.bestOverall.result.pnlPct
                : null,
            health: ladder.bestOverall.health,
          }
        : null,
      bestHealthy: ladder.bestHealthy
        ? {
            size: ladder.bestHealthy.size,
            pnlUsd:
              typeof ladder.bestHealthy.result?.pnlUsd === "number"
                ? ladder.bestHealthy.result.pnlUsd
                : null,
            pnlPct:
              typeof ladder.bestHealthy.result?.pnlPct === "number"
                ? ladder.bestHealthy.result.pnlPct
                : null,
            health: ladder.bestHealthy.health,
          }
        : null,
      curve: ladder.sizes.map((entry) => ({
        size: entry.size,
        pnlUsd:
          typeof entry.result?.pnlUsd === "number" ? entry.result.pnlUsd : null,
        pnlPct:
          typeof entry.result?.pnlPct === "number" ? entry.result.pnlPct : null,
        health: entry.health,
        healthReasons: entry.healthReasons,
      })),
    });
  }

  return evaluations.sort((a, b) => {
    const aScore = a.bestOverall?.pnlUsd ?? -Infinity;
    const bScore = b.bestOverall?.pnlUsd ?? -Infinity;
    return bScore - aScore;
  });
}