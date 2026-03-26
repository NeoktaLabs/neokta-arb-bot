// src/config/env.ts

import type { AppConfig } from "../domain/app-config.types";
import { DEFAULT_ETHERLINK_RPC_URL, normalizeAddress } from "../domain/constants";
import type { Env } from "../domain/types";

const DEFAULT_OKU_QUOTER_V2_ADDRESS = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.trim().toLowerCase() === "true";
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getEnv(env: Env): AppConfig {
  if (!env.USDC_ADDRESS) {
    throw new Error("Missing required env var: USDC_ADDRESS");
  }

  const confidentProfitUsd = parseNumber(env.MIN_CONFIDENT_PROFIT_USD ?? env.MIN_PROFIT_USD, 0.25);

  return {
    rpcUrl: env.ETHERLINK_RPC_URL || DEFAULT_ETHERLINK_RPC_URL,
    initialUsdc: parseNumber(env.INITIAL_USDC, 1000),
    minProfitUsd: confidentProfitUsd,
    minAlertProfitUsd: parseNumber(env.MIN_ALERT_PROFIT_USD, 0),
    minConfidentProfitUsd: confidentProfitUsd,
    usdcAddress: normalizeAddress(env.USDC_ADDRESS),

    enableOku: parseBoolean(env.ENABLE_OKU, true),
    okuQuoterV2Address: normalizeAddress(env.OKU_QUOTER_V2_ADDRESS || DEFAULT_OKU_QUOTER_V2_ADDRESS),

    enableTelegramAlerts: parseBoolean(env.ENABLE_TELEGRAM_ALERTS, false),
    enableNearMissAlerts: parseBoolean(env.ENABLE_NEAR_MISS_ALERTS, false),
    enableImbalanceAlerts: parseBoolean(env.ENABLE_IMBALANCE_ALERTS, true),

    nearMissMinPnlUsd: parseNumber(env.NEAR_MISS_MIN_PNL_USD, -1),
    imbalanceAlertThresholdPct: parseNumber(env.IMBALANCE_ALERT_THRESHOLD_PCT, 20),
    maxAlertsPerScan: Math.max(1, Math.floor(parseNumber(env.MAX_ALERTS_PER_SCAN, 5))),

    telegramBotToken: env.TELEGRAM_BOT_TOKEN?.trim() || "",
    telegramChatId: env.TELEGRAM_CHAT_ID?.trim() || "",
  };
}
