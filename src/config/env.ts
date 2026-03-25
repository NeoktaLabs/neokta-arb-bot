// src/config/env.ts

import type { Env } from "../domain/types";

export function getEnv(env: Env) {
  return {
    rpcUrl:
      env.ETHERLINK_RPC_URL ||
      "https://node.mainnet.etherlink.com",

    initialUsdc: Number(env.INITIAL_USDC || "1000"),
    minProfitUsd: Number(env.MIN_PROFIT_USD || "5"),
  };
}