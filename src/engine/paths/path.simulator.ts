// src/engine/paths/path.simulator.ts

import type { Env } from "../../domain/types";
import { quoteCurveSwap } from "../../integrations/curve/curve.quote";
import type { GeneratedPath, PathLeg } from "./path.types";

function toUnits(amount: number, decimals: number): bigint {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid human amount: ${amount}`);
  }

  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error(`Invalid decimals: ${decimals}`);
  }

  const [wholePartRaw, fractionalPartRaw = ""] = amount.toString().split(".");
  const wholePart = wholePartRaw.replace(/[^\d-]/g, "");
  const fractionalPart = fractionalPartRaw.replace(/\D/g, "").slice(0, decimals);
  const paddedFractional = fractionalPart.padEnd(decimals, "0");
  const sign = wholePart.startsWith("-") ? -1n : 1n;
  const wholeDigits = wholePart.replace("-", "") || "0";
  const base = 10n ** BigInt(decimals);
  const units = BigInt(wholeDigits) * base + BigInt(paddedFractional || "0");

  return sign * units;
}

function fromUnits(amount: bigint, decimals: number): number {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error(`Invalid decimals: ${decimals}`);
  }

  const sign = amount < 0n ? -1 : 1;
  const absolute = amount < 0n ? -amount : amount;
  const base = 10n ** BigInt(decimals);
  const whole = absolute / base;
  const fraction = absolute % base;
  const fractionString = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  const value = fractionString.length > 0 ? `${whole.toString()}.${fractionString}` : whole.toString();

  return Number(value) * sign;
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
    const pnlUsd = finalAmount - initialAmount;

    return {
      key: path.key,
      type: path.type,
      sharedTokenSymbol: path.sharedTokenSymbol,
      initialAmount,
      finalAmount,
      pnlUsd,
      pnlPct: initialAmount > 0 ? pnlUsd / initialAmount : 0,
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
