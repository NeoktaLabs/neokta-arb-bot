// src/http/router.ts

import { getEnabledChains } from "../config/env";
import { DEFAULT_CHAIN_ID, isChainId } from "../domain/chains";
import type { Env } from "../domain/types";
import { getDefaultSizeLadder } from "../engine/sizing/size-ladder";
import { logError, logInfo } from "../lib/logger";
import { acquireGlobalScanLock } from "../lib/scan-lock";
import { runBaselineWorkflow } from "../workflows/run-baseline.workflow";
import { runDiscoveryWorkflow } from "../workflows/run-discovery.workflow";
import { runImbalanceWorkflow } from "../workflows/run-imbalance.workflow";
import { runInternalOpportunitiesWorkflow } from "../workflows/run-internal-opportunities.workflow";
import { runMultiHopWorkflow } from "../workflows/run-multihop.workflow";
import { createScanContext, runFullScanWorkflow } from "../workflows/run-scan.workflow";

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

function resolveChainId(url: URL) {
  const raw = url.searchParams.get("chain");
  return isChainId(raw) ? raw : DEFAULT_CHAIN_ID;
}

function redactEnv(env: Env) {
  return {
    ETHERLINK_RPC_URL: env.ETHERLINK_RPC_URL ?? null,
    ETHEREUM_RPC_URL: env.ETHEREUM_RPC_URL ?? null,
    ENABLE_ETHEREUM: env.ENABLE_ETHEREUM ?? null,
    ENABLE_UNISWAP: env.ENABLE_UNISWAP ?? null,
    ETHEREUM_UNISWAP_FACTORY_ADDRESS: env.ETHEREUM_UNISWAP_FACTORY_ADDRESS ?? null,
    ETHEREUM_UNISWAP_QUOTER_V2_ADDRESS: env.ETHEREUM_UNISWAP_QUOTER_V2_ADDRESS ?? null,
    INITIAL_USDC: env.INITIAL_USDC ?? null,
    LADDER_SIZES: env.LADDER_SIZES ?? null,
    OKU_QUOTER_V2_ADDRESS: env.OKU_QUOTER_V2_ADDRESS ?? null,
    TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN ? "***redacted***" : null,
    TELEGRAM_CHAT_ID: env.TELEGRAM_CHAT_ID ? "***redacted***" : null,
  };
}

export function createRouter(env: Env) {
  return {
    async handle(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const method = request.method.toUpperCase();
      const chainId = resolveChainId(url);

      try {
        if (url.pathname === "/" && method === "GET") {
          return json({ ok: true, service: "neokta-arb-bot", enabledChains: getEnabledChains(env), defaultChain: DEFAULT_CHAIN_ID });
        }

        if (url.pathname === "/health" && method === "GET") {
          return json({ ok: true, service: "neokta-arb-bot", enabledChains: getEnabledChains(env), timestamp: new Date().toISOString() });
        }

        if (url.pathname === "/scan" && (method === "GET" || method === "POST")) {
          const context = createScanContext(env, chainId);
          const lock = await acquireGlobalScanLock({
            env,
            scanId: context.scanId,
            ownerType: "manual",
            chainId: context.chainId,
          });

          if (!lock.acquired) {
            return json(
              {
                ok: false,
                error: "Scan already running",
                reason: lock.reason ?? "locked",
                scanId: context.scanId,
                chainId: context.chainId,
              },
              { status: lock.status ?? 409 }
            );
          }

          try {
            const result = await runFullScanWorkflow(context);
            return json({ ok: true, result });
          } finally {
            await lock.release();
          }
        }

        if (url.pathname === "/scan/discovery" && method === "POST") {
          const context = createScanContext(env, chainId);
          return json({ ok: true, scanId: context.scanId, result: await runDiscoveryWorkflow(context) });
        }

        if (url.pathname === "/scan/baseline" && method === "POST") {
          const context = createScanContext(env, chainId);
          const discovery = await runDiscoveryWorkflow(context);
          return json({ ok: true, scanId: context.scanId, result: await runBaselineWorkflow(context, discovery, getDefaultSizeLadder(env)) });
        }

        if (url.pathname === "/scan/multihop" && method === "POST") {
          const context = createScanContext(env, chainId);
          const discovery = await runDiscoveryWorkflow(context);
          return json({ ok: true, scanId: context.scanId, result: await runMultiHopWorkflow(context, discovery, getDefaultSizeLadder(env)) });
        }

        if (url.pathname === "/scan/internal" && method === "POST") {
          const context = createScanContext(env, chainId);
          const discovery = await runDiscoveryWorkflow(context);
          const imbalance = await runImbalanceWorkflow(context, discovery);
          return json({ ok: true, scanId: context.scanId, result: await runInternalOpportunitiesWorkflow(context, discovery, imbalance, getDefaultSizeLadder(env)) });
        }

        if (url.pathname === "/debug/pools" && method === "GET") {
          const context = createScanContext(env, chainId);
          const discovery = await runDiscoveryWorkflow(context);
          return json({ ok: true, scanId: context.scanId, chainId: context.chainId, summary: discovery.summary, routePools: discovery.routePools, usdcPools: discovery.usdcPools });
        }

        if (url.pathname === "/debug/config" && method === "GET") {
          const context = createScanContext(env, chainId);
          return json({
            ok: true,
            scanId: context.scanId,
            chainId: context.chainId,
            config: {
              ...context.config,
              telegramBotToken: context.config.telegramBotToken ? "***redacted***" : "",
              telegramChatId: context.config.telegramChatId ? "***redacted***" : "",
            },
            rawEnv: redactEnv(env),
          });
        }

        return json({ ok: false, error: "Route not found", path: url.pathname }, { status: 404 });
      } catch (error) {
        logError("http.request.failed", {
          method,
          path: url.pathname,
          chainId,
          error: error instanceof Error ? error.message : String(error),
        });
        return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
      } finally {
        logInfo("http.request.completed", { method, path: url.pathname, chainId });
      }
    },
  };
}
