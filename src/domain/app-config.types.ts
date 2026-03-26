// src/domain/app-config.types.ts

import type { Address } from "./types";

export interface AppConfig {
  rpcUrl: string;
  initialUsdc: number;
  minProfitUsd: number;
  minAlertProfitUsd: number;
  minConfidentProfitUsd: number;
  usdcAddress: Address;

  enableOku: boolean;
  okuQuoterV2Address: Address;

  enableTelegramAlerts: boolean;
  enableNearMissAlerts: boolean;
  enableImbalanceAlerts: boolean;

  nearMissMinPnlUsd: number;
  imbalanceAlertThresholdPct: number;
  maxAlertsPerScan: number;

  telegramBotToken: string;
  telegramChatId: string;
}
