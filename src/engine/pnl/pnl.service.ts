// src/engine/pnl/pnl.service.ts

export interface ComputedPnl {
  inputAmount: number;
  outputAmount: number;
  pnlUsd: number;
  pnlPct: number;
}

export function computePnl(inputAmount: number, outputAmount: number): ComputedPnl {
  const pnlUsd = outputAmount - inputAmount;
  const pnlPct = inputAmount > 0 ? pnlUsd / inputAmount : 0;

  return {
    inputAmount,
    outputAmount,
    pnlUsd,
    pnlPct,
  };
}

export function isProfitablePnl(pnlUsd: number, minimumProfitUsd = 0): boolean {
  return Number.isFinite(pnlUsd) && pnlUsd > minimumProfitUsd;
}
