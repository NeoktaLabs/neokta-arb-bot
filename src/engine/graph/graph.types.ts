// src/engine/graph/graph.types.ts

export interface GraphEdge {
  poolAddress: string;
  poolName: string;

  tokenA: string;
  tokenB: string;

  indexA: number;
  indexB: number;

  decimalsA: number;
  decimalsB: number;
}

export interface TokenGraph {
  edges: GraphEdge[];
  adjacency: Map<string, GraphEdge[]>;
}