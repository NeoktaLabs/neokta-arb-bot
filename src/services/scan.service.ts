// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { getEnv } from "../config/env";
import { discoverCurvePools } from "../integrations/curve/curve.discovery";
import { generatePaths } from "../engine/paths/path.generator";
import { simulatePath } from "../engine/paths/path.simulator";
import { logInfo } from "../lib/logger";

export async function runScan(env: Env) {
  const config = getEnv(env);

  // 1. Discover pools
  const pools = await discoverCurvePools(env);

  // 2. Generate paths
  const paths = generatePaths(pools);

  // 3. Simulate all paths
  const results = [];

  for (const path of paths) {
    const result = await simulatePath(
      env,
      path,
      config.initialUsdc
    );

    results.push(result);
  }

  // 4. Filter profitable
  const profitable = results.filter(
    (r: any) =>
      r.pnlUsd !== undefined &&
      r.pnlUsd > config.minProfitUsd
  );

  const output = {
    totalPools: pools.length,
    totalPaths: paths.length,
    totalSimulations: results.length,
    profitable,
    results,
  };

  logInfo("Scan result", output);

  return output;
}