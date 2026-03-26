// src/integrations/rpc/rpc-guard.ts

import type { ChainId } from "../../domain/chains";

export interface RpcGuardOptions {
  chainId: ChainId;
  maxConcurrency: number;
  minIntervalMs: number;
  maxRetries: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
  jitterMs: number;
}

type Task<T> = () => Promise<T>;

interface QueueState {
  active: number;
  queue: Array<() => void>;
  lastStartedAt: number;
}

const queueStates = new Map<string, QueueState>();

function getQueueState(key: string): QueueState {
  const existing = queueStates.get(key);
  if (existing) return existing;

  const created: QueueState = {
    active: 0,
    queue: [],
    lastStartedAt: 0,
  };

  queueStates.set(key, created);
  return created;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withJitter(baseMs: number, jitterMs: number): number {
  if (jitterMs <= 0) return baseMs;
  return baseMs + Math.floor(Math.random() * jitterMs);
}

function isRetryableRpcError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  return (
    normalized.includes("429") ||
    normalized.includes("too many requests") ||
    normalized.includes("rate limit") ||
    normalized.includes("call rate limit exhausted") ||
    normalized.includes("timeout") ||
    normalized.includes("timed out") ||
    normalized.includes("socket hang up") ||
    normalized.includes("network error") ||
    normalized.includes("fetch failed") ||
    normalized.includes("internal error") ||
    normalized.includes("service unavailable") ||
    normalized.includes("temporarily unavailable")
  );
}

async function acquireSlot(key: string, options: RpcGuardOptions): Promise<() => void> {
  const state = getQueueState(key);

  await new Promise<void>((resolve) => {
    const tryStart = () => {
      if (state.active >= options.maxConcurrency) {
        state.queue.push(tryStart);
        return;
      }

      const now = Date.now();
      const waitMs = Math.max(0, options.minIntervalMs - (now - state.lastStartedAt));

      state.active += 1;
      state.lastStartedAt = now + waitMs;

      if (waitMs > 0) {
        setTimeout(resolve, waitMs);
      } else {
        resolve();
      }
    };

    tryStart();
  });

  return () => {
    state.active = Math.max(0, state.active - 1);
    const next = state.queue.shift();
    if (next) next();
  };
}

export async function runWithRpcGuard<T>(
  key: string,
  options: RpcGuardOptions,
  task: Task<T>
): Promise<T> {
  let attempt = 0;

  while (true) {
    const release = await acquireSlot(key, options);

    try {
      const result = await task();
      release();
      return result;
    } catch (error) {
      release();
      attempt += 1;

      if (!isRetryableRpcError(error) || attempt > options.maxRetries) {
        throw error;
      }

      const unclampedBackoff = options.baseBackoffMs * 2 ** (attempt - 1);
      const backoffMs = Math.min(unclampedBackoff, options.maxBackoffMs);
      await sleep(withJitter(backoffMs, options.jitterMs));
    }
  }
}
