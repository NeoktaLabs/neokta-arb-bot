// src/integrations/curve/curve.quote.ts

import type { Env } from "../../domain/types";
import { getCurveDyInt128, getCurveDyUint256 } from "./curve.client";

export type CurveQuoteMethod = "get_dy_int128" | "get_dy_uint256";

export interface CurveQuoteSupport {
  supported: boolean;
  method?: CurveQuoteMethod;
  testedAmount?: string;
  error?: string;
}

const supportCache = new Map<string, CurveQuoteSupport>();

function cacheKey(poolAddress: string, i: number, j: number): string {
  return `${poolAddress.toLowerCase()}:${i}:${j}`;
}

function buildProbeAmounts(decimalsIn: number): bigint[] {
  const amounts = new Set<bigint>();

  const safePow = (exp: number) => BigInt(10) ** BigInt(Math.max(0, exp));

  amounts.add(1n);

  if (decimalsIn >= 3) {
    amounts.add(safePow(decimalsIn - 3)); // 0.001 units
  }

  if (decimalsIn >= 1) {
    amounts.add(safePow(decimalsIn - 1)); // 0.1 units
  }

  amounts.add(safePow(decimalsIn)); // 1 unit

  return Array.from(amounts).sort((a, b) => (a < b ? -1 : 1));
}

async function tryMethod(
  env: Env,
  method: CurveQuoteMethod,
  poolAddress: string,
  i: number,
  j: number,
  dx: bigint
): Promise<bigint> {
  if (method === "get_dy_int128") {
    return getCurveDyInt128(env, poolAddress, i, j, dx);
  }

  return getCurveDyUint256(env, poolAddress, i, j, dx);
}

export async function probeCurveQuoteSupport(args: {
  env: Env;
  poolAddress: string;
  i: number;
  j: number;
  decimalsIn: number;
}): Promise<CurveQuoteSupport> {
  const key = cacheKey(args.poolAddress, args.i, args.j);
  const cached = supportCache.get(key);

  if (cached) {
    return cached;
  }

  const methods: CurveQuoteMethod[] = ["get_dy_int128", "get_dy_uint256"];
  const probeAmounts = buildProbeAmounts(args.decimalsIn);

  let lastError = "quote probing failed";

  for (const method of methods) {
    for (const amount of probeAmounts) {
      try {
        const result = await tryMethod(
          args.env,
          method,
          args.poolAddress,
          args.i,
          args.j,
          amount
        );

        if (typeof result === "bigint" && result >= 0n) {
          const support: CurveQuoteSupport = {
            supported: true,
            method,
            testedAmount: amount.toString(),
          };

          supportCache.set(key, support);
          return support;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }
  }

  const failed: CurveQuoteSupport = {
    supported: false,
    error: lastError,
  };

  supportCache.set(key, failed);
  return failed;
}

export async function quoteCurveSwap(args: {
  env: Env;
  poolAddress: string;
  i: number;
  j: number;
  dx: bigint;
  decimalsIn: number;
}): Promise<bigint> {
  const support = await probeCurveQuoteSupport({
    env: args.env,
    poolAddress: args.poolAddress,
    i: args.i,
    j: args.j,
    decimalsIn: args.decimalsIn,
  });

  if (!support.supported || !support.method) {
    throw new Error(support.error || "No supported Curve quote method found");
  }

  return tryMethod(
    args.env,
    support.method,
    args.poolAddress,
    args.i,
    args.j,
    args.dx
  );
}