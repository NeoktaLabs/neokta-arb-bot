// src/domain/scan-context.types.ts

import type { AppConfig } from "./app-config.types";
import type { ChainId } from "./chains";
import type { Env } from "./types";

export interface ScanContext {
  scanId: string;
  startedAt: number;
  env: Env;
  chainId: ChainId;
  config: AppConfig;
}
