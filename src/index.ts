// src/index.ts

import type { Env } from "./domain/types";
import { runScan } from "./services/scan.service";

async function handleRun(env: Env): Promise<Response> {
  try {
    const result = await runScan(env);

    return Response.json({
      ok: true,
      result,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export default {
  async fetch(_request: Request, env: Env) {
    return handleRun(env);
  },

  async scheduled(_controller: unknown, env: Env, ctx: { waitUntil(promise: Promise<Response>): void }) {
    ctx.waitUntil(handleRun(env));
  },
};
