// src/engine/paths/path.types.ts

export interface PathLeg {
  poolAddress: string;
  poolName: string;

  tokenInSymbol: string;
  tokenOutSymbol: string;

  tokenInIndex: number;
  tokenOutIndex: number;

  tokenInDecimals: number;
  tokenOutDecimals: number;
}

export interface GeneratedPath {
  key: string;
  type: "same-pool-roundtrip" | "cross-pool-roundtrip";
  sharedTokenSymbol: string;
  legs: [PathLeg, PathLeg];
}