// src/engine/graph/graph.types.ts

import type { Address } from "../../domain/types";
import type { VenueId } from "../../domain/markets";

export interface GraphEdge {
  venue: VenueId;
  poolAddress: Address;
  poolName: string;

  tokenAAddress: Address;
  tokenBAddress: Address;

  tokenASymbol: string;
  tokenBSymbol: string;

  decimalsA: number;
  decimalsB: number;

  indexA?: number;
  indexB?: number;
  fee?: number;
}

export interface TokenGraph {
  edges: GraphEdge[];
  adjacency: Map<string, GraphEdge[]>;
  usdcAddresses: Address[];
}
