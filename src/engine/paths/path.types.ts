// src/engine/paths/path.types.ts

import type { Address } from "../../domain/types";

export interface PathLeg {
  poolAddress: Address;
  poolName: string;

  tokenInAddress: Address;
  tokenOutAddress: Address;

  tokenInSymbol: string;
  tokenOutSymbol: string;

  tokenInIndex: number;
  tokenOutIndex: number;

  tokenInDecimals: number;
  tokenOutDecimals: number;
}

export interface GeneratedPath {
  key: string;
  type: "same-pool-roundtrip" | "cross-pool-roundtrip" | "multi-hop-roundtrip";
  sharedTokenAddress: Address;
  sharedTokenSymbol: string;
  legs: PathLeg[];
}