// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { CURVE_POOLS } from "../integrations/curve/curve.pools";
import { getCurveDy, getCurvePoolSnapshot } from "../integrations/curve/curve.client";
import { logInfo } from "../lib/logger";

function toUnits(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * 10 ** decimals));
}

function fromUnits(amount: bigint, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

export async function runScan(env: Env) {
  const pool = CURVE_POOLS[0];

  const snapshot = await getCurvePoolSnapshot(env, pool.address);

  const coin0 = snapshot.coins[0];
  const coin1 = snapshot.coins[1];

  const testAmount = 1;
  const dx = toUnits(testAmount, coin0.decimals);

  const dy = await getCurveDy(env, pool.address, coin0.index, coin1.index, dx);

  const amountOut = fromUnits(dy, coin1.decimals);

  const result = {
    pool: pool.name,
    poolAddress: pool.address,
    coin0,
    coin1,
    testSwap: {
      fromSymbol: coin0.symbol,
      toSymbol: coin1.symbol,
      amountIn: testAmount,
      amountOut,
    },
  };

  logInfo("Curve pool test result", result);

  return result;
}