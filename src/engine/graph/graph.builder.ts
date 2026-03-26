// src/engine/graph/graph.builder.ts

import type { MarketPool } from "../../domain/markets";
import type { GraphEdge, TokenGraph } from "./graph.types";

export function buildTokenGraph(pools: MarketPool[]): TokenGraph {
  const edges: GraphEdge[] = [];
  const adjacency = new Map<string, GraphEdge[]>();
  const usdcAddresses = new Set<string>();

  for (const pool of pools) {
    const [tokenA, tokenB] = pool.tokens;

    const edge: GraphEdge = {
      venue: pool.venue,
      poolAddress: pool.address,
      poolName: pool.name ?? pool.address,
      tokenAAddress: tokenA.address,
      tokenBAddress: tokenB.address,
      tokenASymbol: tokenA.symbol,
      tokenBSymbol: tokenB.symbol,
      decimalsA: tokenA.decimals,
      decimalsB: tokenB.decimals,
      indexA: tokenA.index,
      indexB: tokenB.index,
      fee: pool.fee,
    };

    edges.push(edge);

    const aKey = edge.tokenAAddress.toLowerCase();
    const bKey = edge.tokenBAddress.toLowerCase();

    if (!adjacency.has(aKey)) adjacency.set(aKey, []);
    if (!adjacency.has(bKey)) adjacency.set(bKey, []);

    adjacency.get(aKey)!.push(edge);
    adjacency.get(bKey)!.push(edge);

    if (pool.usdcTokenAddress) {
      usdcAddresses.add(pool.usdcTokenAddress.toLowerCase());
    }
  }

  return {
    edges,
    adjacency,
    usdcAddresses: Array.from(usdcAddresses) as `0x${string}`[],
  };
}
