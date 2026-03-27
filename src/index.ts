// src/index.ts

import type { Env } from "./domain/types";
import { createRouter } from "./http/router";
import { logError, logInfo } from "./lib/logger";
import { acquireGlobalScanLock } from "./lib/scan-lock";
import { ScanLockDurableObject } from "./durable/scan-lock.do";
import { runScheduledScans } from "./workflows/run-scan.workflow";

export { ScanLockDurableObject };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return createRouter(env).handle(request);
  },

  async scheduled(
    _controller: unknown,
    env: Env,
    ctx: { waitUntil(promise: Promise<unknown>): void }
  ): Promise<void> {
    const scanId = `cron_${Date.now().toString(36)}`;

    ctx.waitUntil((async () => {
      const lock = await acquireGlobalScanLock({
        env,
        scanId,
        ownerType: "scheduled",
      });

      if (!lock.acquired) {
        logInfo("cron.skipped.locked", { scanId, reason: lock.reason ?? "locked" });
        return;
      }

      try {
        await runScheduledScans(env);
      } catch (error) {
        logError("cron.failed", { error: error instanceof Error ? error.message : String(error) });
        throw error;
      } finally {
        await lock.release();
      }
    })());
  },
};
