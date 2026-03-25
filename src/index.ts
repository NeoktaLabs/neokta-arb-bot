// src/index.ts

import { runScan } from "./services/scan.service";

export default {
  async fetch(request: Request, env: any) {
    try {
      const result = await runScan(env);

      return Response.json({
        ok: true,
        result,
      });
    } catch (error) {
      return Response.json({
        ok: false,
        error: String(error),
      });
    }
  },
};