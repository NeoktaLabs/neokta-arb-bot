// src/config/env.ts

import type { AppConfig } from "../domain/app-config.types";
import {
  DEFAULT_ETHERLINK_RPC_URL,
  DEFAULT_ETHEREUM_RPC_URL,
  DEFAULT_ETHEREUM_UNISWAP_FACTORY_ADDRESS,
  DEFAULT_ETHEREUM_UNISWAP_QUOTER_V2_ADDRESS,
  normalizeAddress,
} from "../domain/constants";
import type { ChainId } from "../domain/chains";
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

function parseInteger(value: string | undefined, fallback: number): number {
  return Math.max(0, Math.floor(parseNumber(value, fallback)));
}

function parseNumberArray(value: string | undefined, fallback: number[]): number[] {
  if (!value || value.trim() === "") return fallback;
  const parsed = value
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  return parsed.length > 0 ? parsed : fallback;
}

function requireAddress(name: string, value: string | undefined) {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return normalizeAddress(value);
}

function getDefaultRpcMaxConcurrency(chainId: ChainId): number {
  return chainId === "ethereum" ? 3 : 2;
}

export function getEnabledChains(env: Env): ChainId[] {
  const chains: ChainId[] = ["etherlink"];
  if (parseBoolean(env.ENABLE_ETHEREUM, false)) {
    chains.push("ethereum");
  }
  return chains;
}

export function getEnv(env: Env, chainId: ChainId = "etherlink"): AppConfig {
  const minProfitUsd = parseNumber(env.MIN_PROFIT_USD, 0);
  const minAlertProfitUsd = parseNumber(env.MIN_ALERT_PROFIT_USD, 0);
  const minConfidentProfitUsd = parseNumber(
    env.MIN_CONFIDENT_PROFIT_USD ?? env.MIN_PROFIT_USD,
    0.25
  );

  const base = {
    chainId,
    initialUsdc: parseNumber(env.INITIAL_USDC, 1000),
    minProfitUsd,
    minAlertProfitUsd,
    minConfidentProfitUsd,
    enableTelegramAlerts: parseBoolean(env.ENABLE_TELEGRAM_ALERTS, false),
    enableNearMissAlerts: false,
    enableImbalanceAlerts: parseBoolean(env.ENABLE_IMBALANCE_ALERTS, true),
    nearMissMinPnlUsd: parseNumber(env.NEAR_MISS_MIN_PNL_USD, -1),
    imbalanceAlertThresholdPct: parseNumber(env.IMBALANCE_ALERT_THRESHOLD_PCT, 20),
    maxAlertsPerScan: Math.max(1, parseInteger(env.MAX_ALERTS_PER_SCAN, 5)),
    telegramBotToken: env.TELEGRAM_BOT_TOKEN?.trim() || "",
    telegramChatId: env.TELEGRAM_CHAT_ID?.trim() || "",
    ladderSizes: parseNumberArray(env.LADDER_SIZES, [100, 1000]),
    rpcMaxConcurrency: Math.max(
      1,
      parseInteger(env.RPC_MAX_CONCURRENCY, getDefaultRpcMaxConcurrency(chainId))
    ),
    rpcMinIntervalMs: parseInteger(env.RPC_MIN_INTERVAL_MS, 75),
    rpcMaxRetries: parseInteger(env.RPC_MAX_RETRIES, 3),
    rpcBaseBackoffMs: parseInteger(env.RPC_BASE_BACKOFF_MS, 300),
    rpcMaxBackoffMs: parseInteger(env.RPC_MAX_BACKOFF_MS, 2000),
    rpcJitterMs: parseInteger(env.RPC_JITTER_MS, 150),
  };

  if (chainId === "ethereum") {
    const enableUniswap = parseBoolean(env.ENABLE_UNISWAP, true);
    return {
      ...base,
      rpcUrl: env.ETHEREUM_RPC_URL || DEFAULT_ETHEREUM_RPC_URL,
      usdcAddress: requireAddress("ETHEREUM_USDC_ADDRESS", env.ETHEREUM_USDC_ADDRESS),
      enableOku: false,
      okuQuoterV2Address: ("0x0000000000000000000000000000000000000000" as `0x${string}`),
      enableUniswap,
      uniswapFactoryAddress: enableUniswap
        ? normalizeAddress(
            env.ETHEREUM_UNISWAP_FACTORY_ADDRESS || DEFAULT_ETHEREUM_UNISWAP_FACTORY_ADDRESS
          )
        : ("0x0000000000000000000000000000000000000000" as `0x${string}`),
      uniswapQuoterV2Address: enableUniswap
        ? normalizeAddress(
            env.ETHEREUM_UNISWAP_QUOTER_V2_ADDRESS || DEFAULT_ETHEREUM_UNISWAP_QUOTER_V2_ADDRESS
          )
        : ("0x0000000000000000000000000000000000000000" as `0x${string}`),
    };
  }

  const enableOku = parseBoolean(env.ENABLE_OKU, true);
  return {
    ...base,
    rpcUrl: env.ETHERLINK_RPC_URL || DEFAULT_ETHERLINK_RPC_URL,
    usdcAddress: requireAddress("USDC_ADDRESS", env.USDC_ADDRESS),
    enableOku,
    okuQuoterV2Address: enableOku
      ? requireAddress("OKU_QUOTER_V2_ADDRESS", env.OKU_QUOTER_V2_ADDRESS)
      : ("0x0000000000000000000000000000000000000000" as `0x${string}`),
    enableUniswap: false,
    uniswapFactoryAddress: ("0x0000000000000000000000000000000000000000" as `0x${string}`),
    uniswapQuoterV2Address: ("0x0000000000000000000000000000000000000000" as `0x${string}`),
  };
}
