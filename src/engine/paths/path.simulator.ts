// src/engine/paths/path.simulator.ts

import type { Env } from "../../domain/types";
import { getEnv } from "../../config/env";
import { computePnl } from "../pnl/pnl.service";
import type { PathSimulationResult, SimulationStepResult } from "../simulation/simulation.types";
import { quoteCurveSwap } from "../../integrations/curve/curve.quote";
import { quoteOkuSwap } from "../../integrations/oku/oku.quote";
import { quoteUniswapSwap } from "../../integrations/uniswap/uniswap.quote";
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
  const config = getEnv(env, leg.chainId);
  if (leg.venue === "curve") {
    if (typeof leg.tokenInIndex !== "number" || typeof leg.tokenOutIndex !== "number") throw new Error("Curve leg is missing token indexes");
    return quoteCurveSwap({ env, chainId: leg.chainId, poolAddress: leg.poolAddress, i: leg.tokenInIndex, j: leg.tokenOutIndex, dx: amountInRaw, decimalsIn: leg.tokenInDecimals });
  }
  if (leg.venue === "oku") {
    if (typeof leg.fee !== "number") throw new Error("Oku leg is missing pool fee");
    return quoteOkuSwap({ env, quoterAddress: config.okuQuoterV2Address, poolAddress: leg.poolAddress, tokenIn: leg.tokenInAddress, tokenOut: leg.tokenOutAddress, fee: leg.fee, amountIn: amountInRaw });
  }
  if (typeof leg.fee !== "number") throw new Error("Uniswap leg is missing pool fee");
  return quoteUniswapSwap({ env, quoterAddress: config.uniswapQuoterV2Address, tokenIn: leg.tokenInAddress, tokenOut: leg.tokenOutAddress, fee: leg.fee, amountIn: amountInRaw });
}

export async function simulatePath(env: Env, path: GeneratedPath, initialAmount: number): Promise<PathSimulationResult> {
  try {
    if (!Array.isArray(path.legs) || path.legs.length < 2) throw new Error("Path must contain at least 2 legs");
    const legResults: SimulationStepResult[] = [];
    let currentAmountRaw = toUnits(initialAmount, path.legs[0].tokenInDecimals);
    let currentAmountHuman = initialAmount;
    for (let index = 0; index < path.legs.length; index += 1) {
      const leg = path.legs[index];
      const amountOutRaw = await simulateLeg(env, leg, currentAmountRaw);
      const amountOutHuman = fromUnits(amountOutRaw, leg.tokenOutDecimals);
      legResults.push({ chainId: leg.chainId, venue: leg.venue, poolName: leg.poolName, poolAddress: leg.poolAddress, tokenInSymbol: leg.tokenInSymbol, tokenOutSymbol: leg.tokenOutSymbol, amountIn: currentAmountHuman, amountOut: amountOutHuman });
      currentAmountRaw = amountOutRaw;
      currentAmountHuman = amountOutHuman;
    }
    const pnl = computePnl(initialAmount, currentAmountHuman);
    return { ok: true, key: path.key, type: path.type, sharedTokenSymbol: path.sharedTokenSymbol, initialAmount, finalAmount: pnl.outputAmount, pnlUsd: pnl.pnlUsd, pnlPct: pnl.pnlPct, legs: legResults };
  } catch (error) {
    return { ok: false, key: path.key, type: path.type, sharedTokenSymbol: path.sharedTokenSymbol, initialAmount, error: error instanceof Error ? error.message : String(error), failedAtStep: null, legs: path.legs.map((leg) => ({ chainId: leg.chainId, venue: leg.venue, poolName: leg.poolName, poolAddress: leg.poolAddress, tokenInSymbol: leg.tokenInSymbol, tokenOutSymbol: leg.tokenOutSymbol })) };
  }
}
