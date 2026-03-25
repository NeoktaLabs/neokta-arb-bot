// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { getEnv } from "../config/env";
import { generatePaths } from "../engine/paths/path.generator";
import { simulatePath } from "../engine/paths/path.simulator";
import { discoverCurvePools } from "../integrations/curve/curve.discovery";
import { logInfo } from "../lib/logger";

export async function runScan(env: Env) {
  const config = getEnv(env);

  const pools = await discoverCurvePools(env);
  const paths = generatePaths(pools);

  const results = [];
  for (const path of paths) {
    const result = await simulatePath(env, path, config.initialUsdc);
    results.push(result);
  }

  const profitable = results.filter((result: any) => {
    return (
      typeof result.pnlUsd === "number" &&
      result.pnlUsd > config.minProfitUsd
    );
  });

  const output = {
    totalPools: pools.length,
    totalPaths: paths.length,
    totalSimulations: results.length,
    profitableCount: profitable.length,
    profitable,
    results,
  };

  logInfo("Scan result", output);

  return output;
}