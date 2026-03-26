// src/domain/app-config.types.ts

import type { ChainId } from "./chains";
import type { Address } from "./types";

export interface AppConfig {
  chainId: ChainId;
  rpcUrl: string;
  initialUsdc: number;
  minProfitUsd: number;
  minAlertProfitUsd: number;
  minConfidentProfitUsd: number;
  usdcAddress: Address;

  enableOku: boolean;
  okuQuoterV2Address: Address;

  enableUniswap: boolean;
  uniswapFactoryAddress: Address;
  uniswapQuoterV2Address: Address;

  enableTelegramAlerts: boolean;
  enableNearMissAlerts: boolean;
  enableImbalanceAlerts: boolean;

  nearMissMinPnlUsd: number;
  imbalanceAlertThresholdPct: number;
  maxAlertsPerScan: number;

  telegramBotToken: string;
  telegramChatId: string;

  ladderSizes: number[];
}
