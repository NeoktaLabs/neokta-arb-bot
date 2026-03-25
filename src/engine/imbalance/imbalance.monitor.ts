// src/engine/imbalance/imbalance.monitor.ts

import type { Env } from "../../domain/types";
import { quoteCurveSwap } from "../../integrations/curve/curve.quote";
import type { DiscoveredCurvePool } from "../../integrations/curve/curve.types";
import type {
  DirectionalQuotePoint,
  DirectionalQuoteSummary,
  PoolImbalanceReport,
} from "./imbalance.types";

function fromUnits(amount: bigint, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

function toUnits(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * 10 ** decimals));
}

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

function classifyImbalance(imbalancePct: number): "balanced" | "imbalanced" | "extreme" {
  if (imbalancePct < 20) return "balanced";
  if (imbalancePct < 40) return "imbalanced";
  return "extreme";
}

async function quoteDirection(args: {
  env: Env;
  pool: DiscoveredCurvePool;
  fromIndex: number;
  toIndex: number;
  fromSymbol: string;
  toSymbol: string;
  fromDecimals: number;
  sizes: number[];
}): Promise<DirectionalQuoteSummary> {
  const points: DirectionalQuotePoint[] = [];

  for (const size of args.sizes) {
    try {
      const amountInRaw = toUnits(size, args.fromDecimals);

      const amountOutRaw = await quoteCurveSwap({
        env: args.env,
        poolAddress: args.pool.address,
        i: args.fromIndex,
        j: args.toIndex,
        dx: amountInRaw,
        decimalsIn: args.fromDecimals,
      });

      points.push({
        size,
        amountOut: fromUnits(amountOutRaw, args.pool.coins.find((c) => c.index === args.toIndex)!.decimals),
      });
    } catch (error) {
      points.push({
        size,
        amountOut: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    fromSymbol: args.fromSymbol,
    toSymbol: args.toSymbol,
    sizes: points,
  };
}

export async function monitorPoolImbalance(args: {
  env: Env;
  pool: DiscoveredCurvePool;
  quoteSizes?: number[];
}): Promise<PoolImbalanceReport> {
  const { env, pool } = args;
  const quoteSizes = args.quoteSizes ?? [1, 10, 100];

  if (pool.coins.length !== 2) {
    throw new Error("Imbalance monitor currently supports only 2-coin pools");
  }

  const [coin0, coin1] = pool.coins;

  const token0Balance = Number(pool.balances?.[0] ?? 0);
  const token1Balance = Number(pool.balances?.[1] ?? 0);

  const totalBalance = token0Balance + token1Balance;

  const token0SharePct = totalBalance > 0 ? (token0Balance / totalBalance) * 100 : 0;
  const token1SharePct = totalBalance > 0 ? (token1Balance / totalBalance) * 100 : 0;

  const imbalancePct = Math.abs(token0SharePct - token1SharePct);
  const classification = classifyImbalance(imbalancePct);

  const token0ToToken1 = await quoteDirection({
    env,
    pool,
    fromIndex: coin0.index,
    toIndex: coin1.index,
    fromSymbol: coin0.symbol,
    toSymbol: coin1.symbol,
    fromDecimals: coin0.decimals,
    sizes: quoteSizes,
  });

  const token1ToToken0 = await quoteDirection({
    env,
    pool,
    fromIndex: coin1.index,
    toIndex: coin0.index,
    fromSymbol: coin1.symbol,
    toSymbol: coin0.symbol,
    fromDecimals: coin1.decimals,
    sizes: quoteSizes,
  });

  return {
    poolAddress: pool.address,
    poolName: pool.name,
    token0Symbol: coin0.symbol,
    token1Symbol: coin1.symbol,
    token0Balance: round(token0Balance, 6),
    token1Balance: round(token1Balance, 6),
    token0SharePct: round(token0SharePct, 2),
    token1SharePct: round(token1SharePct, 2),
    imbalancePct: round(imbalancePct, 2),
    classification,
    directionalQuotes: {
      token0ToToken1,
      token1ToToken0,
    },
  };
}