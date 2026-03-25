// src/engine/graph/graph.builder.ts

import type { DiscoveredCurvePool } from "../../integrations/curve/curve.types";
import type { GraphEdge, TokenGraph } from "./graph.types";

function normalize(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function buildTokenGraph(pools: DiscoveredCurvePool[]): TokenGraph {
  const edges: GraphEdge[] = [];
  const adjacency = new Map<string, GraphEdge[]>();

  for (const pool of pools) {
    if (!pool.isTwoCoinPool) continue;

    const [coinA, coinB] = pool.coins;

    const edge: GraphEdge = {
      poolAddress: pool.address,
      poolName: pool.name ?? pool.address,

      tokenA: normalize(coinA.symbol),
      tokenB: normalize(coinB.symbol),

      indexA: coinA.index,
      indexB: coinB.index,

      decimalsA: coinA.decimals,
      decimalsB: coinB.decimals,
    };

    edges.push(edge);

    if (!adjacency.has(edge.tokenA)) adjacency.set(edge.tokenA, []);
    if (!adjacency.has(edge.tokenB)) adjacency.set(edge.tokenB, []);

    adjacency.get(edge.tokenA)!.push(edge);
    adjacency.get(edge.tokenB)!.push(edge);
  }

  return { edges, adjacency };
}