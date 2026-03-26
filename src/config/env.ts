// src/config/env.ts

import { normalizeAddress } from "../domain/constants";
import type { Env } from "../domain/types";

const DEFAULT_ETHERLINK_RPC_URL = "https://node.mainnet.etherlink.com";

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function requireAddress(name: string, value: string | undefined): `0x${string}` {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }

  return normalizeAddress(value.trim()) as `0x${string}`;
}

export type AppConfig = {
  rpcUrl: string;
  initialUsdc: number;
  minProfitUsd: number;
  minAlertProfitUsd: number;
  minConfidentProfitUsd: number;
  usdcAddress: `0x${string}`;

  enableOku: boolean;
  okuQuoterV2Address?: `0x${string}`;

  enableTelegramAlerts: boolean;
  telegramBotToken: string;
  telegramChatId: string;

  enableNearMissAlerts: boolean;
  enableImbalanceAlerts: boolean;
  nearMissMinPnlUsd: number;
  imbalanceAlertThresholdPct: number;
  maxAlertsPerScan: number;
};

export function getEnv(env: Env): AppConfig {
  const usdcAddress = requireAddress("USDC_ADDRESS", env.USDC_ADDRESS);

  const minProfitUsd = parseNumber(env.MIN_PROFIT_USD, 0);
  const minAlertProfitUsd = parseNumber(env.MIN_ALERT_PROFIT_USD, 0);
  const minConfidentProfitUsd = parseNumber(
    env.MIN_CONFIDENT_PROFIT_USD,
    minProfitUsd
  );

  const enableOku = parseBoolean(env.ENABLE_OKU, true);

  const okuQuoterV2Address = enableOku
    ? requireAddress("OKU_QUOTER_V2_ADDRESS", env.OKU_QUOTER_V2_ADDRESS)
    : undefined;

  const enableTelegramAlerts = parseBoolean(env.ENABLE_TELEGRAM_ALERTS, false);
  const telegramBotToken = env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const telegramChatId = env.TELEGRAM_CHAT_ID?.trim() ?? "";

  return {
    rpcUrl: env.ETHERLINK_RPC_URL?.trim() || DEFAULT_ETHERLINK_RPC_URL,
    initialUsdc: parseNumber(env.INITIAL_USDC, 1000),
    minProfitUsd,
    minAlertProfitUsd,
    minConfidentProfitUsd,
    usdcAddress,

    enableOku,
    okuQuoterV2Address,

    enableTelegramAlerts,
    telegramBotToken,
    telegramChatId,

    enableNearMissAlerts: false,
    enableImbalanceAlerts: parseBoolean(env.ENABLE_IMBALANCE_ALERTS, true),
    nearMissMinPnlUsd: parseNumber(env.NEAR_MISS_MIN_PNL_USD, -1),
    imbalanceAlertThresholdPct: parseNumber(env.IMBALANCE_ALERT_THRESHOLD_PCT, 20),
    maxAlertsPerScan: Math.max(1, Math.floor(parseNumber(env.MAX_ALERTS_PER_SCAN, 5))),
  };
}