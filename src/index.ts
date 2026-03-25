// src/index.ts

import type { Env } from "./domain/types";
import { runScan } from "./services/scan.service";

async function run(env: Env) {
  const result = await runScan(env);

  return Response.json({
    ok: true,
    result,
  });
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      const url = new URL(request.url);

      if (url.pathname === "/health") {
        return Response.json({ ok: true });
      }

      return await run(env);
    } catch (error) {
      return Response.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runScan(env));
  },
};
