// src/integrations/etherlink/rpc.client.ts

import { createPublicClient, http } from "viem";
import { getEnv } from "../../config/env";
import type { ChainId } from "../../domain/chains";
import type { Env } from "../../domain/types";

const clients = new Map<string, ReturnType<typeof createPublicClient>>();

export function getClient(env: Env, chainId: ChainId = "etherlink") {
  const { rpcUrl } = getEnv(env, chainId);
  const cacheKey = `${chainId}:${rpcUrl}`;

  const existing = clients.get(cacheKey);
  if (existing) return existing;

  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  clients.set(cacheKey, client);
  return client;
}
