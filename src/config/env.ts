// src/config/env.ts

import type { AppConfig } from "../domain/app-config.types";
import { DEFAULT_ETHERLINK_RPC_URL, normalizeAddress } from "../domain/constants";
import type { Env } from "../domain/types";

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function requireAddress(name: string, value: string | undefined) {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }

  return normalizeAddress(value);
}

export function getEnv(env: Env): AppConfig {
  const usdcAddress = requireAddress("USDC_ADDRESS", env.USDC_ADDRESS);
  const enableOku = parseBoolean(env.ENABLE_OKU, true);

  const minProfitUsd = parseNumber(env.MIN_PROFIT_USD, 0);
  const minAlertProfitUsd = parseNumber(env.MIN_ALERT_PROFIT_USD, 0);
  const minConfidentProfitUsd = parseNumber(
    env.MIN_CONFIDENT_PROFIT_USD ?? env.MIN_PROFIT_USD,
    0.25
  );

  return {
    rpcUrl: env.ETHERLINK_RPC_URL || DEFAULT_ETHERLINK_RPC_URL,
    initialUsdc: parseNumber(env.INITIAL_USDC, 1000),
    minProfitUsd,
    minAlertProfitUsd,
    minConfidentProfitUsd,
    usdcAddress,

    enableOku,
    okuQuoterV2Address: enableOku
      ? requireAddress("OKU_QUOTER_V2_ADDRESS", env.OKU_QUOTER_V2_ADDRESS)
      : ("0x0000000000000000000000000000000000000000" as `0x${string}`),

    enableTelegramAlerts: parseBoolean(env.ENABLE_TELEGRAM_ALERTS, false),
    enableNearMissAlerts: false,
    enableImbalanceAlerts: parseBoolean(env.ENABLE_IMBALANCE_ALERTS, true),

    nearMissMinPnlUsd: parseNumber(env.NEAR_MISS_MIN_PNL_USD, -1),
    imbalanceAlertThresholdPct: parseNumber(env.IMBALANCE_ALERT_THRESHOLD_PCT, 20),
    maxAlertsPerScan: Math.max(1, Math.floor(parseNumber(env.MAX_ALERTS_PER_SCAN, 5))),

    telegramBotToken: env.TELEGRAM_BOT_TOKEN?.trim() || "",
    telegramChatId: env.TELEGRAM_CHAT_ID?.trim() || "",
  };
}