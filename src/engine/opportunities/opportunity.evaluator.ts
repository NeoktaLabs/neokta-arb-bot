// src/engine/opportunities/opportunity.evaluator.ts

import type { Env } from "../../domain/types";
import { getDefaultSizeLadder, simulatePathAcrossSizes } from "../sizing/size-ladder";
import type { GeneratedPath } from "../paths/path.types";
import type { OpportunityCandidate, OpportunityEvaluation, OpportunityBestResult } from "./opportunity.types";

function toBestResult(entry: {
  size: number;
  health: string;
  result: { pnlUsd: number; pnlPct: number };
} | null): OpportunityBestResult | null {
  if (!entry) {
    return null;
  }

  return {
    size: entry.size,
    pnlUsd: entry.result.pnlUsd,
    pnlPct: entry.result.pnlPct,
    health: entry.health,
  };
}

function dedupeEvaluations(evaluations: OpportunityEvaluation[]): OpportunityEvaluation[] {
  const seen = new Set<string>();
  const deduped: OpportunityEvaluation[] = [];

  for (const evaluation of evaluations) {
    const signature = [
      evaluation.candidate.key,
      evaluation.candidate.direction,
      evaluation.candidate.poolAddress.toLowerCase(),
      evaluation.candidate.token0Symbol,
      evaluation.candidate.token1Symbol,
      evaluation.bestProfitable?.size ?? "none",
      evaluation.bestProfitable?.pnlUsd ?? "none",
      evaluation.curve.length,
    ].join(":");

    if (seen.has(signature)) {
      continue;
    }

    seen.add(signature);
    deduped.push(evaluation);
  }

  return deduped;
}

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
      bestOverall: toBestResult(ladder.bestOverall),
      bestHealthy: toBestResult(ladder.bestHealthy),
      bestProfitable: toBestResult(ladder.bestProfitable),
      curve: ladder.sizes.map((entry) => ({
        size: entry.size,
        pnlUsd: entry.result.ok ? entry.result.pnlUsd : null,
        pnlPct: entry.result.ok ? entry.result.pnlPct : null,
        health: entry.health,
        healthReasons: entry.healthReasons,
      })),
    });
  }

  const deduped = dedupeEvaluations(evaluations);

  return deduped.sort((a, b) => {
    const aScore = a.bestProfitable?.pnlUsd ?? -Infinity;
    const bScore = b.bestProfitable?.pnlUsd ?? -Infinity;
    return bScore - aScore;
  });
}
