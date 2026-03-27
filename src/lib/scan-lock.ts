// src/lib/scan-lock.ts

import type { Env } from "../domain/types";

type LockHandle = {
  acquired: boolean;
  release: () => Promise<void>;
  reason?: string;
  status?: number;
};

const SCAN_LOCK_OBJECT_NAME = "global-scan-lock";
const DEFAULT_LOCK_TTL_MS = 20 * 60 * 1000;

function createNoopHandle(reason?: string, status?: number): LockHandle {
  return {
    acquired: false,
    reason,
    status,
    release: async () => {},
  };
}

function getLockStub(env: Env) {
  if (!env.SCAN_LOCK) {
    throw new Error("Missing Durable Object binding: SCAN_LOCK");
  }

  const id = env.SCAN_LOCK.idFromName(SCAN_LOCK_OBJECT_NAME);
  return env.SCAN_LOCK.get(id);
}

export async function acquireGlobalScanLock(args: {
  env: Env;
  scanId: string;
  ownerType: "scheduled" | "manual";
  chainId?: string;
  ttlMs?: number;
}): Promise<LockHandle> {
  const stub = getLockStub(args.env);
  const response = await stub.fetch("https://scan-lock/acquire", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      scanId: args.scanId,
      ownerType: args.ownerType,
      chainId: args.chainId,
      ttlMs: args.ttlMs ?? DEFAULT_LOCK_TTL_MS,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { reason?: string };
    return createNoopHandle(body.reason ?? "locked", response.status);
  }

  return {
    acquired: true,
    release: async () => {
      await stub.fetch("https://scan-lock/release", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scanId: args.scanId }),
      });
    },
  };
}
