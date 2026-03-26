// src/workflows/run-discovery.workflow.ts

import type { MarketPool } from "../domain/markets";
import type { ScanContext } from "../domain/scan-context.types";
import type { DiscoveryWorkflowReport } from "../domain/scan-report.types";
import { discoverCurvePools } from "../integrations/curve/curve.discovery";
import { discoverOkuPools } from "../integrations/oku/oku.discovery";
import { logInfo } from "../lib/logger";

function toMarketPools(
  curvePools: Awaited<ReturnType<typeof discoverCurvePools>>,
  okuPools: Awaited<ReturnType<typeof discoverOkuPools>>
): MarketPool[] {
  const normalizedCurve: MarketPool[] = curvePools
    .filter((pool) => pool.isTwoCoinPool && pool.coins.length === 2)
    .map((pool) => ({
      venue: "curve" as const,
      address: pool.address,
      name: pool.name,
      tokens: [
        {
          address: pool.coins[0].address,
          symbol: pool.coins[0].symbol,
          decimals: pool.coins[0].decimals,
          index: pool.coins[0].index,
        },
        {
          address: pool.coins[1].address,
          symbol: pool.coins[1].symbol,
          decimals: pool.coins[1].decimals,
          index: pool.coins[1].index,
        },
      ],
      hasUsdc: pool.hasUsdc,
      usdcTokenAddress: pool.usdcCoinAddress,
    }));

  const normalizedOku: MarketPool[] = okuPools.map((pool) => ({
    venue: "oku" as const,
    address: pool.address,
    name: pool.name,
    tokens: [pool.token0, pool.token1],
    hasUsdc: pool.hasUsdc,
    usdcTokenAddress: pool.usdcTokenAddress,
    fee: pool.fee,
    metadata: {
      liquidity: pool.liquidity.toString(),
      tick: pool.tick,
    },
  }));

  return [...normalizedCurve, ...normalizedOku];
}

export async function runDiscoveryWorkflow(context: ScanContext): Promise<DiscoveryWorkflowReport> {
  const curvePools = await discoverCurvePools(context.env);
  const okuPools = context.config.enableOku ? await discoverOkuPools(context.env) : [];
  const marketPools = toMarketPools(curvePools, okuPools);
  const routePools = marketPools.filter((pool) => pool.tokens.length === 2);
  const usdcPools = routePools.filter((pool) => pool.hasUsdc);

  const summary = {
    curve: curvePools.length,
    oku: okuPools.length,
    total: routePools.length,
    usdcAnchored: usdcPools.length,
  };

  logInfo("scan.discovery.completed", {
    scanId: context.scanId,
    ...summary,
  });

  return {
    curvePools,
    okuPools,
    marketPools,
    routePools,
    usdcPools,
    summary,
  };
}
