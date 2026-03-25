// src/engine/paths/path.simulator.ts

import type { Env } from "../../domain/types";
import { getCurveDy } from "../../integrations/curve/curve.client";
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
  amountIn: bigint
): Promise<bigint> {
  return getCurveDy(
    env,
    leg.poolAddress,
    leg.tokenInIndex,
    leg.tokenOutIndex,
    amountIn
  );
}

export async function simulatePath(
  env: Env,
  path: GeneratedPath,
  initialAmount: number
) {
  try {
    const [leg1, leg2] = path.legs;

    const amountInLeg1 = toUnits(initialAmount, leg1.tokenInDecimals);
    const amountOutLeg1Raw = await simulateLeg(env, leg1, amountInLeg1);
    const amountOutLeg1 = fromUnits(amountOutLeg1Raw, leg1.tokenOutDecimals);

    const amountOutLeg2Raw = await simulateLeg(env, leg2, amountOutLeg1Raw);
    const finalAmount = fromUnits(amountOutLeg2Raw, leg2.tokenOutDecimals);

    return {
      type: path.type,
      sharedTokenSymbol: path.sharedTokenSymbol,

      initialAmount,
      intermediateAmount: amountOutLeg1,
      finalAmount,

      pnlUsd: finalAmount - initialAmount,
      pnlPct: (finalAmount - initialAmount) / initialAmount,

      legs: [
        {
          pool: leg1.poolName,
          poolAddress: leg1.poolAddress,
          fromSymbol: leg1.tokenInSymbol,
          toSymbol: leg1.tokenOutSymbol,
          amountIn: initialAmount,
          amountOut: amountOutLeg1,
        },
        {
          pool: leg2.poolName,
          poolAddress: leg2.poolAddress,
          fromSymbol: leg2.tokenInSymbol,
          toSymbol: leg2.tokenOutSymbol,
          amountIn: amountOutLeg1,
          amountOut: finalAmount,
        },
      ],
    };
  } catch (error) {
    return {
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