// src/engine/graph/graph.types.ts

import type { Address } from "../../domain/types";

export interface GraphEdge {
  poolAddress: Address;
  poolName: string;

  tokenAAddress: Address;
  tokenBAddress: Address;

  tokenASymbol: string;
  tokenBSymbol: string;

  indexA: number;
  indexB: number;

  decimalsA: number;
  decimalsB: number;
}

export interface TokenGraph {
  edges: GraphEdge[];
  adjacency: Map<string, GraphEdge[]>;
  usdcAddresses: Address[];
}