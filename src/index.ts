// src/index.ts

import type { Env } from "./domain/types";
import { createRouter } from "./http/router";
import { logError } from "./lib/logger";
import { runScheduledScans } from "./workflows/run-scan.workflow";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return createRouter(env).handle(request);
  },
  async scheduled(_controller: unknown, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<void> {
    ctx.waitUntil(runScheduledScans(env).catch((error) => {
      logError("cron.failed", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }));
  },
};
