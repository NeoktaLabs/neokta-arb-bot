// src/domain/constants.ts

import type { Address } from "./types";

export const DEFAULT_ETHERLINK_RPC_URL = "https://node.mainnet.etherlink.com";
export const DEFAULT_ETHEREUM_RPC_URL = "https://ethereum-rpc.publicnode.com";

export const DEFAULT_ETHEREUM_UNISWAP_FACTORY_ADDRESS =
  "0x1F98431c8aD98523631AE4a59f267346ea31F984" as Address;
export const DEFAULT_ETHEREUM_UNISWAP_QUOTER_V2_ADDRESS =
  "0x61fFE014bA17989E743c5F6cB21bF9697530B21e" as Address;

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
