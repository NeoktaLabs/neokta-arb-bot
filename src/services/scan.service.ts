// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { runScanWorkflow } from "../workflows/run-scan.workflow";

export async function runScan(env: Env) {
  return runScanWorkflow(env);
}
