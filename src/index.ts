// src/index.ts

import type { Env } from "./domain/types";
import { createRouter } from "./http/router";
import { logError } from "./lib/logger";
import { runScanWorkflow } from "./workflows/run-scan.workflow";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const router = createRouter(env);
    return router.handle(request);
  },

  async scheduled(
    _controller: unknown,
    env: Env,
    ctx: { waitUntil(promise: Promise<unknown>): void }
  ): Promise<void> {
    ctx.waitUntil(
      runScanWorkflow(env).catch((error) => {
        logError("scheduled.scan.failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      })
    );
  },
};
