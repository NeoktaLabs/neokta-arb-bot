// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { discoverCurvePools } from "../integrations/curve/curve.discovery";
import { logInfo } from "../lib/logger";

export async function runScan(env: Env) {
  const pools = await discoverCurvePools(env);

  const usdcPools = pools.filter((p) => p.hasUsdc);

  const result = {
    totalPools: pools.length,
    usdcPools: usdcPools.length,
    pools,
  };

  logInfo("Curve discovery result", result);

  return result;
}