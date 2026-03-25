// src/integrations/etherlink/rpc.client.ts

import { createPublicClient, http } from "viem";
import type { Env } from "../../domain/types";
import { getEnv } from "../../config/env";

let client: ReturnType<typeof createPublicClient> | null = null;

export function getClient(env: Env) {
  if (client) return client;

  const { rpcUrl } = getEnv(env);

  client = createPublicClient({
    transport: http(rpcUrl),
  });

  return client;
}