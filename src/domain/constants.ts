// src/domain/constants.ts

import type { Address } from "./types";

export const DEFAULT_ETHERLINK_RPC_URL = "https://node.mainnet.etherlink.com";

export function normalizeAddress(value: string): Address {
  const trimmed = value.trim();

  if (!trimmed.startsWith("0x")) {
    throw new Error(`Invalid address: ${value}`);
  }

  return trimmed.toLowerCase() as Address;
}

export function addressesEqual(a: string, b: string): boolean {
  return normalizeAddress(a) === normalizeAddress(b);
}

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function isUsdcAddress(address: string, usdcAddress: string): boolean {
  return addressesEqual(address, usdcAddress);
}