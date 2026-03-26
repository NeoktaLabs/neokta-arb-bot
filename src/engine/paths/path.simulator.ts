// src/engine/paths/path.simulator.ts

import type { Env } from "../../domain/types";
import { getEnv } from "../../config/env";
import { quoteCurveSwap } from "../../integrations/curve/curve.quote";
import { quoteOkuSwap } from "../../integrations/oku/oku.quote";
import type { GeneratedPath, PathLeg } from "./path.types";

function toUnits(amount: number, decimals: number): bigint {
  const [wholeRaw, fractionRaw = ""] = amount.toFixed(decimals + 2).split(".");
  const whole = BigInt(wholeRaw);
  const fraction = BigInt((fractionRaw.slice(0, decimals) || "").padEnd(decimals, "0"));
  return whole * 10n ** BigInt(decimals) + fraction;
}

function fromUnits(amount: bigint, decimals: number): number {
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const fraction = amount % base;
  const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 8);
  return Number(`${whole.toString()}.${fractionStr || "0"}`);
}

async function simulateLeg(env: Env, leg: PathLeg, amountInRaw: bigint): Promise<bigint> {
  if (leg.venue === "curve") {
    if (typeof leg.tokenInIndex !== "number" || typeof leg.tokenOutIndex !== "number") {
      throw new Error("Curve leg is missing token indexes");
    }

    return quoteCurveSwap({
      env,
      poolAddress: leg.poolAddress,
      i: leg.tokenInIndex,
      j: leg.tokenOutIndex,
      dx: amountInRaw,
      decimalsIn: leg.tokenInDecimals,
    });
  }

  const config = getEnv(env);
  if (typeof leg.fee !== "number") {
    throw new Error("Oku leg is missing pool fee");
  }

  return quoteOkuSwap({
    env,
    quoterAddress: config.okuQuoterV2Address,
    tokenIn: leg.tokenInAddress,
    tokenOut: leg.tokenOutAddress,
    fee: leg.fee,
    amountIn: amountInRaw,
  });
}

export async function simulatePath(env: Env, path: GeneratedPath, initialAmount: number) {
  try {
    if (!Array.isArray(path.legs) || path.legs.length < 2) {
      throw new Error("Path must contain at least 2 legs");
    }

    const legResults = [];

    let currentAmountRaw = toUnits(initialAmount, path.legs[0].tokenInDecimals);
    let currentAmountHuman = initialAmount;

    for (const leg of path.legs) {
      const amountOutRaw = await simulateLeg(env, leg, currentAmountRaw);
      const amountOutHuman = fromUnits(amountOutRaw, leg.tokenOutDecimals);

      legResults.push({
        venue: leg.venue,
        pool: leg.poolName,
        poolAddress: leg.poolAddress,
        fromSymbol: leg.tokenInSymbol,
        toSymbol: leg.tokenOutSymbol,
        amountIn: currentAmountHuman,
        amountOut: amountOutHuman,
      });

      currentAmountRaw = amountOutRaw;
      currentAmountHuman = amountOutHuman;
    }

    const finalAmount = currentAmountHuman;

    return {
      key: path.key,
      type: path.type,
      sharedTokenSymbol: path.sharedTokenSymbol,
      initialAmount,
      finalAmount,
      pnlUsd: finalAmount - initialAmount,
      pnlPct: initialAmount > 0 ? (finalAmount - initialAmount) / initialAmount : 0,
      legs: legResults,
    };
  } catch (error) {
    return {
      key: path.key,
      type: path.type,
      sharedTokenSymbol: path.sharedTokenSymbol,
      error: error instanceof Error ? error.message : String(error),
      legs: path.legs.map((leg) => ({
        venue: leg.venue,
        pool: leg.poolName,
        poolAddress: leg.poolAddress,
        fromSymbol: leg.tokenInSymbol,
        toSymbol: leg.tokenOutSymbol,
      })),
    };
  }
}
