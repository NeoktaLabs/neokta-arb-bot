// src/engine/paths/multi-hop.generator.ts

import type { TokenGraph } from "../graph/graph.types";
import type { GeneratedPath, PathLeg } from "./path.types";

const START_TOKEN = "USDC";
const MAX_DEPTH = 3;

function buildLeg(
  edge: {
    poolAddress: string;
    poolName: string;
    tokenA: string;
    tokenB: string;
    indexA: number;
    indexB: number;
    decimalsA: number;
    decimalsB: number;
  },
  fromToken: string
): { leg: PathLeg; nextToken: string } {
  const fromA = edge.tokenA === fromToken;

  return {
    leg: {
      poolAddress: edge.poolAddress,
      poolName: edge.poolName,

      tokenInSymbol: fromToken,
      tokenOutSymbol: fromA ? edge.tokenB : edge.tokenA,

      tokenInIndex: fromA ? edge.indexA : edge.indexB,
      tokenOutIndex: fromA ? edge.indexB : edge.indexA,

      tokenInDecimals: fromA ? edge.decimalsA : edge.decimalsB,
      tokenOutDecimals: fromA ? edge.decimalsB : edge.decimalsA,
    },
    nextToken: fromA ? edge.tokenB : edge.tokenA,
  };
}

export function generateMultiHopPaths(graph: TokenGraph): GeneratedPath[] {
  const paths: GeneratedPath[] = [];
  const seen = new Set<string>();

  function dfs(
    currentToken: string,
    depth: number,
    currentLegs: PathLeg[],
    visitedPools: Set<string>
  ) {
    if (depth > MAX_DEPTH) return;

    const edges = graph.adjacency.get(currentToken) ?? [];

    for (const edge of edges) {
      if (visitedPools.has(edge.poolAddress)) continue;

      const { leg, nextToken } = buildLeg(edge, currentToken);

      const nextLegs = [...currentLegs, leg];
      const nextVisitedPools = new Set(visitedPools);
      nextVisitedPools.add(edge.poolAddress);

      if (nextToken === START_TOKEN && nextLegs.length >= 2) {
        const key = [
          "multi",
          ...nextLegs.map((item) => item.poolAddress.toLowerCase()),
          ...nextLegs.map((item) => `${item.tokenInSymbol}->${item.tokenOutSymbol}`),
        ].join(":");

        if (!seen.has(key)) {
          seen.add(key);

          paths.push({
            key,
            type: "multi-hop-roundtrip",
            sharedTokenSymbol: "MULTI",
            legs: nextLegs,
          });
        }

        continue;
      }

      dfs(nextToken, depth + 1, nextLegs, nextVisitedPools);
    }
  }

  dfs(START_TOKEN, 0, [], new Set());

  return paths;
}