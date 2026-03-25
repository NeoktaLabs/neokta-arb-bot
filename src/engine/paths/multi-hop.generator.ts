// src/engine/paths/multi-hop.generator.ts

import type { GeneratedPath, PathLeg } from "./path.types";
import type { TokenGraph } from "../graph/graph.types";

const MAX_DEPTH = 3; // USDC -> A -> B -> USDC

function buildLeg(
  edge: any,
  fromToken: string
): { leg: PathLeg; nextToken: string } {
  const isA = edge.tokenA === fromToken;

  return {
    leg: {
      poolAddress: edge.poolAddress,
      poolName: edge.poolName,

      tokenInSymbol: fromToken,
      tokenOutSymbol: isA ? edge.tokenB : edge.tokenA,

      tokenInIndex: isA ? edge.indexA : edge.indexB,
      tokenOutIndex: isA ? edge.indexB : edge.indexA,

      tokenInDecimals: isA ? edge.decimalsA : edge.decimalsB,
      tokenOutDecimals: isA ? edge.decimalsB : edge.decimalsA,
    },
    nextToken: isA ? edge.tokenB : edge.tokenA,
  };
}

export function generateMultiHopPaths(graph: TokenGraph): GeneratedPath[] {
  const paths: GeneratedPath[] = [];

  const start = "USDC";

  function dfs(
    currentToken: string,
    depth: number,
    path: PathLeg[],
    visitedPools: Set<string>
  ) {
    if (depth > MAX_DEPTH) return;

    const edges = graph.adjacency.get(currentToken) || [];

    for (const edge of edges) {
      if (visitedPools.has(edge.poolAddress)) continue;

      const { leg, nextToken } = buildLeg(edge, currentToken);

      const newPath = [...path, leg];
      const newVisited = new Set(visitedPools);
      newVisited.add(edge.poolAddress);

      // 🎯 LOOP FOUND
      if (nextToken === start && newPath.length >= 2) {
        paths.push({
          key: ["multi", ...newPath.map((l) => l.poolAddress)].join(":"),
          type: "cross-pool-roundtrip",
          sharedTokenSymbol: "MULTI",
          legs: newPath as any,
        });
        continue;
      }

      dfs(nextToken, depth + 1, newPath, newVisited);
    }
  }

  dfs(start, 0, [], new Set());

  return paths;
}