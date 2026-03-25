// src/engine/paths/multi-hop.generator.ts

import type { TokenGraph } from "../graph/graph.types";
import type { GeneratedPath, PathLeg } from "./path.types";

const MAX_DEPTH = 3;

function buildLeg(
  edge: {
    poolAddress: string;
    poolName: string;
    tokenAAddress: string;
    tokenBAddress: string;
    tokenASymbol: string;
    tokenBSymbol: string;
    indexA: number;
    indexB: number;
    decimalsA: number;
    decimalsB: number;
  },
  fromTokenAddress: string
): { leg: PathLeg; nextTokenAddress: string } {
  const fromA = edge.tokenAAddress.toLowerCase() === fromTokenAddress.toLowerCase();

  return {
    leg: {
      poolAddress: edge.poolAddress as `0x${string}`,
      poolName: edge.poolName,

      tokenInAddress: (fromA ? edge.tokenAAddress : edge.tokenBAddress) as `0x${string}`,
      tokenOutAddress: (fromA ? edge.tokenBAddress : edge.tokenAAddress) as `0x${string}`,

      tokenInSymbol: fromA ? edge.tokenASymbol : edge.tokenBSymbol,
      tokenOutSymbol: fromA ? edge.tokenBSymbol : edge.tokenASymbol,

      tokenInIndex: fromA ? edge.indexA : edge.indexB,
      tokenOutIndex: fromA ? edge.indexB : edge.indexA,

      tokenInDecimals: fromA ? edge.decimalsA : edge.decimalsB,
      tokenOutDecimals: fromA ? edge.decimalsB : edge.decimalsA,
    },
    nextTokenAddress: fromA ? edge.tokenBAddress : edge.tokenAAddress,
  };
}

export function generateMultiHopPaths(graph: TokenGraph): GeneratedPath[] {
  const paths: GeneratedPath[] = [];
  const seen = new Set<string>();

  function dfs(
    startTokenAddress: string,
    currentTokenAddress: string,
    depth: number,
    currentLegs: PathLeg[],
    visitedPools: Set<string>
  ) {
    if (depth > MAX_DEPTH) return;

    const edges = graph.adjacency.get(currentTokenAddress.toLowerCase()) ?? [];

    for (const edge of edges) {
      if (visitedPools.has(edge.poolAddress.toLowerCase())) continue;

      const { leg, nextTokenAddress } = buildLeg(edge, currentTokenAddress);

      const nextLegs = [...currentLegs, leg];
      const nextVisitedPools = new Set(visitedPools);
      nextVisitedPools.add(edge.poolAddress.toLowerCase());

      if (
        nextTokenAddress.toLowerCase() === startTokenAddress.toLowerCase() &&
        nextLegs.length >= 2
      ) {
        const key = [
          "multi",
          startTokenAddress.toLowerCase(),
          ...nextLegs.map((item) => item.poolAddress.toLowerCase()),
          ...nextLegs.map(
            (item) => `${item.tokenInAddress.toLowerCase()}->${item.tokenOutAddress.toLowerCase()}`
          ),
        ].join(":");

        if (!seen.has(key)) {
          seen.add(key);

          paths.push({
            key,
            type: "multi-hop-roundtrip",
            sharedTokenAddress: nextLegs[0].tokenOutAddress,
            sharedTokenSymbol: "MULTI",
            legs: nextLegs,
          });
        }

        continue;
      }

      dfs(startTokenAddress, nextTokenAddress, depth + 1, nextLegs, nextVisitedPools);
    }
  }

  for (const usdcAddress of graph.usdcAddresses) {
    dfs(usdcAddress, usdcAddress, 0, [], new Set());
  }

  return paths;
}