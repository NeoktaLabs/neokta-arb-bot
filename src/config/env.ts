// src/config/env.ts

import { DEFAULT_ETHERLINK_RPC_URL, normalizeAddress } from "../domain/constants";
import type { Env } from "../domain/types";

export function getEnv(env: Env) {
  if (!env.USDC_ADDRESS) {
    throw new Error("Missing required env var: USDC_ADDRESS");
  }

  return {
    rpcUrl: env.ETHERLINK_RPC_URL || DEFAULT_ETHERLINK_RPC_URL,
    initialUsdc: Number(env.INITIAL_USDC || "1000"),
    minProfitUsd: Number(env.MIN_PROFIT_USD || "5"),
    usdcAddress: normalizeAddress(env.USDC_ADDRESS),
  };
}