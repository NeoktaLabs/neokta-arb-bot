// src/integrations/curve/curve.discovery.ts

import type { ChainId } from "../../domain/chain.types";
import type { Env } from "../../domain/types";
import { getEnv } from "../../config/env";
import { normalizeAddress, isUsdcAddress } from "../../domain/constants";
import { logError, logInfo } from "../../lib/logger";
import { getCurvePoolSnapshot } from "./curve.client";
import { getCurvePoolsForChain } from "./curve.pools";
import type { DiscoveredCurvePool } from "./curve.types";

function humanizeBalance(raw: bigint, decimals: number): number {
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const fraction = raw % base;
  const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 8);
  return Number(`${whole.toString()}.${fractionStr || "0"}`);
}

export async function discoverCurvePools(
  env: Env,
  chainId: ChainId
): Promise<DiscoveredCurvePool[]> {
  const config = getEnv(env);
  const pools = getCurvePoolsForChain(chainId);
  const discovered: DiscoveredCurvePool[] = [];

  for (const pool of pools) {
    try {
      const snapshot = await getCurvePoolSnapshot(env, chainId, pool.address);

      const tokens = snapshot.tokens.map((token, index) => ({
        ...token,
        index,
        balance: humanizeBalance(snapshot.rawBalances[index], token.decimals),
        rawBalance: snapshot.rawBalances[index],
      }));

      const usdcToken = tokens.find((token) =>
        isUsdcAddress(normalizeAddress(token.address), config.usdcAddress)
      );

      const result: DiscoveredCurvePool = {
        name: pool.name,
        address: normalizeAddress(pool.address),
        tokens,
        hasUsdc: Boolean(usdcToken),
        usdcTokenAddress: usdcToken ? normalizeAddress(usdcToken.address) : null,
      };

      discovered.push(result);

      logInfo("curve.pool.discovered", {
        chainId,
        pool: result.name,
        address: result.address,
        tokenCount: result.tokens.length,
        hasUsdc: result.hasUsdc,
      });
    } catch (error) {
      logError("curve.pool.discovery_failed", {
        chainId,
        pool: pool.name,
        address: pool.address,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return discovered;
}