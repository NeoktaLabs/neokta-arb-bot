// src/integrations/etherlink/rpc.client.ts

import { createPublicClient, http } from "viem";
import { getEnv } from "../../config/env";
import type { ChainId } from "../../domain/chains";
import type { Env } from "../../domain/types";
import { runWithRpcGuard } from "../rpc/rpc-guard";

type RpcClient = ReturnType<typeof createPublicClient>;

const rawClients = new Map<string, RpcClient>();
const guardedClients = new Map<string, RpcClient>();

function getRawClient(env: Env, chainId: ChainId): RpcClient {
  const { rpcUrl } = getEnv(env, chainId);
  const cacheKey = `${chainId}:${rpcUrl}`;

  const existing = rawClients.get(cacheKey);
  if (existing) return existing;

  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  rawClients.set(cacheKey, client);
  return client;
}

export function getClient(env: Env, chainId: ChainId = "etherlink"): RpcClient {
  const config = getEnv(env, chainId);
  const cacheKey = `${chainId}:${config.rpcUrl}:${config.rpcMaxConcurrency}:${config.rpcMinIntervalMs}:${config.rpcMaxRetries}`;

  const existing = guardedClients.get(cacheKey);
  if (existing) return existing;

  const rawClient = getRawClient(env, chainId);

  const guardOptions = {
    chainId,
    maxConcurrency: config.rpcMaxConcurrency,
    minIntervalMs: config.rpcMinIntervalMs,
    maxRetries: config.rpcMaxRetries,
    baseBackoffMs: config.rpcBaseBackoffMs,
    maxBackoffMs: config.rpcMaxBackoffMs,
    jitterMs: config.rpcJitterMs,
  };

  const keyPrefix = `${chainId}:${config.rpcUrl}`;

  const guarded = {
    ...rawClient,
    readContract: (args: Parameters<typeof rawClient.readContract>[0]) =>
      runWithRpcGuard(`${keyPrefix}:readContract`, guardOptions, () => rawClient.readContract(args)),
    getBytecode: (args: Parameters<typeof rawClient.getBytecode>[0]) =>
      runWithRpcGuard(`${keyPrefix}:getBytecode`, guardOptions, () => rawClient.getBytecode(args)),
    call: (args: Parameters<typeof rawClient.call>[0]) =>
      runWithRpcGuard(`${keyPrefix}:call`, guardOptions, () => rawClient.call(args)),
  } as RpcClient;

  guardedClients.set(cacheKey, guarded);
  return guarded;
}
