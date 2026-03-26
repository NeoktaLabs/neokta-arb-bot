// src/domain/chains.ts

export type ChainId = "etherlink" | "ethereum";

export const DEFAULT_CHAIN_ID: ChainId = "etherlink";

export function isChainId(value: string | null | undefined): value is ChainId {
  return value === "etherlink" || value === "ethereum";
}
