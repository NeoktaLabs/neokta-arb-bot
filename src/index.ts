// src/index.ts

import type { Env } from "./domain/types";
import { runScan } from "./services/scan.service";

export default {
  async fetch(_request: Request, env: Env) {
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
  },
};