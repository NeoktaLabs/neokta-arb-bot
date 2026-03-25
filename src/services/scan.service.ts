// src/services/scan.service.ts

import type { Env } from "../domain/types";
import { getEnv } from "../config/env";
import { getCurveDy } from "../integrations/curve/curve.client";
import { CURVE_POOLS } from "../integrations/curve/curve.pools";
import { logInfo } from "../lib/logger";

const USDC_DECIMALS = 6;

function toBigInt(amount: number): bigint {
  return BigInt(Math.floor(amount * 10 ** USDC_DECIMALS));
}

function fromBigInt(amount: bigint): number {
  return Number(amount) / 10 ** USDC_DECIMALS;
}

export async function runScan(env: Env) {
  const config = getEnv(env);

  const pool = CURVE_POOLS[0];

  const initial = config.initialUsdc;
  const dx = toBigInt(initial);

  // USDC -> WXTZ
  const out1 = await getCurveDy(env, pool.address, 0, 1, dx);

  // WXTZ -> USDC
  const out2 = await getCurveDy(env, pool.address, 1, 0, out1);

  const finalAmount = fromBigInt(out2);

  const result = {
    pool: pool.name,
    initialAmount: initial,
    finalAmount,
    pnlUsd: finalAmount - initial,
    pnlPct: (finalAmount - initial) / initial,
  };

  logInfo("Curve loop result", result);

  return result;
}