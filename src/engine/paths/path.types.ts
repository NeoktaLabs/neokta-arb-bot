// src/engine/paths/path.types.ts

export interface GeneratedPath {
  poolAddress: string;
  poolName: string;

  tokenInSymbol: string;
  tokenOutSymbol: string;

  tokenInIndex: number;
  tokenOutIndex: number;

  tokenInDecimals: number;
  tokenOutDecimals: number;
}