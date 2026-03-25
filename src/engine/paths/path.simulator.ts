// src/engine/paths/path.simulator.ts

import type { Env } from "../../domain/types";
import { quoteCurveSwap } from "../../integrations/curve/curve.quote";
import type { GeneratedPath, PathLeg } from "./path.types";

function toUnits(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * 10 ** decimals));
}

function fromUnits(amount: bigint, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

async function simulateLeg(
  env: Env,
  leg: PathLeg,
  amountInRaw: bigint
): Promise<bigint> {
  return quoteCurveSwap({
    env,
    poolAddress: leg.poolAddress,
    i: leg.tokenInIndex,
    j: leg.tokenOutIndex,
    dx: amountInRaw,
    decimalsIn: leg.tokenInDecimals,
  });
}

export async function simulatePath(
  env: Env,
  path: GeneratedPath,
  initialAmount: number
) {
  try {
    if (!Array.isArray(path.legs) || path.legs.length < 2) {
      throw new Error("Path must contain at least 2 legs");
    }

    const legResults = [];

    let currentAmountRaw = toUnits(initialAmount, path.legs[0].tokenInDecimals);
    let currentAmountHuman = initialAmount;

    for (let i = 0; i < path.legs.length; i++) {
      const leg = path.legs[i];

      const amountOutRaw = await simulateLeg(env, leg, currentAmountRaw);
      const amountOutHuman = fromUnits(amountOutRaw, leg.tokenOutDecimals);

      legResults.push({
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
      pnlPct: (finalAmount - initialAmount) / initialAmount,
      legs: legResults,
    };
  } catch (error) {
    return {
      key: path.key,
      type: path.type,
      sharedTokenSymbol: path.sharedTokenSymbol,
      error: error instanceof Error ? error.message : String(error),
      legs: path.legs.map((leg) => ({
        pool: leg.poolName,
        poolAddress: leg.poolAddress,
        fromSymbol: leg.tokenInSymbol,
        toSymbol: leg.tokenOutSymbol,
      })),
    };
  }
}