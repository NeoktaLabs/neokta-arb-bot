// src/engine/paths/path.simulator.ts

import type { Env } from "../../domain/types";
import { getCurveDy } from "../../integrations/curve/curve.client";
import type { GeneratedPath } from "./path.types";

function toUnits(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * 10 ** decimals));
}

function fromUnits(amount: bigint, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

export async function simulatePath(
  env: Env,
  path: GeneratedPath,
  initialAmount: number
) {
  try {
    // Step 1: USDC -> Token
    const dx = toUnits(initialAmount, path.tokenInDecimals);

    const out1 = await getCurveDy(
      env,
      path.poolAddress,
      path.tokenInIndex,
      path.tokenOutIndex,
      dx
    );

    const amountToken = fromUnits(out1, path.tokenOutDecimals);

    // Step 2: Token -> USDC
    const out2 = await getCurveDy(
      env,
      path.poolAddress,
      path.tokenOutIndex,
      path.tokenInIndex,
      out1
    );

    const finalAmount = fromUnits(out2, path.tokenInDecimals);

    return {
      pool: path.poolName,
      pair: `${path.tokenInSymbol}/${path.tokenOutSymbol}`,

      initialAmount,
      finalAmount,

      pnlUsd: finalAmount - initialAmount,
      pnlPct: (finalAmount - initialAmount) / initialAmount,
    };
  } catch (err) {
    return {
      pool: path.poolName,
      error: String(err),
    };
  }
}