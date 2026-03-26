// src/workflows/run-discovery.workflow.ts

import type { MarketPool } from "../domain/markets";
import type { ScanContext } from "../domain/scan-context.types";
import type { DiscoveryWorkflowReport } from "../domain/scan-report.types";
import { discoverCurvePools } from "../integrations/curve/curve.discovery";
import { discoverOkuPools } from "../integrations/oku/oku.discovery";
import { discoverUniswapPools } from "../integrations/uniswap/uniswap.discovery";
import { logInfo } from "../lib/logger";

function toMarketPools(context: ScanContext, curvePools: Awaited<ReturnType<typeof discoverCurvePools>>, okuPools: Awaited<ReturnType<typeof discoverOkuPools>>, uniswapPools: Awaited<ReturnType<typeof discoverUniswapPools>>): MarketPool[] {
  const normalizedCurve: MarketPool[] = curvePools.filter((pool) => pool.isTwoCoinPool && pool.coins.length === 2).map((pool) => ({
    chainId: context.chainId,
    venue: "curve",
    address: pool.address,
    name: pool.name,
    tokens: [
      { address: pool.coins[0].address, symbol: pool.coins[0].symbol, decimals: pool.coins[0].decimals, index: pool.coins[0].index },
      { address: pool.coins[1].address, symbol: pool.coins[1].symbol, decimals: pool.coins[1].decimals, index: pool.coins[1].index },
    ],
    hasUsdc: pool.hasUsdc,
    usdcTokenAddress: pool.usdcCoinAddress,
  }));

  const normalizedOku: MarketPool[] = okuPools.map((pool) => ({
    chainId: context.chainId,
    venue: "oku",
    address: pool.address,
    name: pool.name,
    tokens: [pool.token0, pool.token1],
    hasUsdc: pool.hasUsdc,
    usdcTokenAddress: pool.usdcTokenAddress,
    fee: pool.fee,
    metadata: { liquidity: pool.liquidity.toString(), tick: pool.tick },
  }));

  const normalizedUniswap: MarketPool[] = uniswapPools.map((pool) => ({
    chainId: context.chainId,
    venue: "uniswap",
    address: pool.address,
    name: pool.name,
    tokens: [pool.token0, pool.token1],
    hasUsdc: pool.hasUsdc,
    usdcTokenAddress: pool.usdcTokenAddress,
    fee: pool.fee,
    metadata: { liquidity: pool.liquidity.toString(), tick: pool.tick },
  }));

  return [...normalizedCurve, ...normalizedOku, ...normalizedUniswap];
}

export async function runDiscoveryWorkflow(context: ScanContext): Promise<DiscoveryWorkflowReport> {
  const curvePools = await discoverCurvePools(context.env, context.config);
  const okuPools = context.config.enableOku ? await discoverOkuPools(context.env) : [];
  const uniswapPools = context.config.enableUniswap ? await discoverUniswapPools(context.env, context.config) : [];
  const marketPools = toMarketPools(context, curvePools, okuPools, uniswapPools);
  const routePools = marketPools.filter((pool) => pool.tokens.length === 2);
  const usdcPools = routePools.filter((pool) => pool.hasUsdc);
  const summary = { curve: curvePools.length, oku: okuPools.length, uniswap: uniswapPools.length, total: routePools.length, usdcAnchored: usdcPools.length };
  logInfo("scan.discovery.completed", { scanId: context.scanId, chainId: context.chainId, ...summary });
  return { curvePools, okuPools, uniswapPools, marketPools, routePools, usdcPools, summary };
}
