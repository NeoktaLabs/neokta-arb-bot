// src/engine/graph/graph.builder.ts

import type { DiscoveredCurvePool } from "../../integrations/curve/curve.types";
import type { GraphEdge, TokenGraph } from "./graph.types";

export function buildTokenGraph(pools: DiscoveredCurvePool[]): TokenGraph {
  const edges: GraphEdge[] = [];
  const adjacency = new Map<string, GraphEdge[]>();
  const usdcAddresses = new Set<string>();

  for (const pool of pools) {
    if (!pool.isTwoCoinPool) continue;
    if (pool.coins.length !== 2) continue;

    const [coinA, coinB] = pool.coins;

    const edge: GraphEdge = {
      poolAddress: pool.address,
      poolName: pool.name ?? pool.address,

      tokenAAddress: coinA.address,
      tokenBAddress: coinB.address,

      tokenASymbol: coinA.symbol,
      tokenBSymbol: coinB.symbol,

      indexA: coinA.index,
      indexB: coinB.index,

      decimalsA: coinA.decimals,
      decimalsB: coinB.decimals,
    };

    edges.push(edge);

    const aKey = edge.tokenAAddress.toLowerCase();
    const bKey = edge.tokenBAddress.toLowerCase();

    if (!adjacency.has(aKey)) adjacency.set(aKey, []);
    if (!adjacency.has(bKey)) adjacency.set(bKey, []);

    adjacency.get(aKey)!.push(edge);
    adjacency.get(bKey)!.push(edge);

    if (pool.usdcCoinAddress) {
      usdcAddresses.add(pool.usdcCoinAddress.toLowerCase());
    }
  }

  return {
    edges,
    adjacency,
    usdcAddresses: Array.from(usdcAddresses) as `0x${string}`[],
  };
}