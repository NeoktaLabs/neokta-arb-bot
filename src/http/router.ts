// src/http/router.ts

import type { Env } from "../domain/types";
import { logError, logInfo } from "../lib/logger";
import { runBaselineWorkflow } from "../workflows/run-baseline.workflow";
import { runDiscoveryWorkflow } from "../workflows/run-discovery.workflow";
import { runInternalOpportunitiesWorkflow } from "../workflows/run-internal-opportunities.workflow";
import { runMultiHopWorkflow } from "../workflows/run-multihop.workflow";
import { createScanContext, runFullScanWorkflow } from "../workflows/run-scan.workflow";
import { runImbalanceWorkflow } from "../workflows/run-imbalance.workflow";
import { getDefaultSizeLadder } from "../engine/sizing/size-ladder";

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

function redactEnv(env: Env) {
  return {
    ETHERLINK_RPC_URL: env.ETHERLINK_RPC_URL ?? null,
    INITIAL_USDC: env.INITIAL_USDC ?? null,
    MIN_PROFIT_USD: env.MIN_PROFIT_USD ?? null,
    MIN_ALERT_PROFIT_USD: env.MIN_ALERT_PROFIT_USD ?? null,
    MIN_CONFIDENT_PROFIT_USD: env.MIN_CONFIDENT_PROFIT_USD ?? null,
    USDC_ADDRESS: env.USDC_ADDRESS ?? null,
    ENABLE_OKU: env.ENABLE_OKU ?? null,
    OKU_QUOTER_V2_ADDRESS: env.OKU_QUOTER_V2_ADDRESS ?? null,
    ENABLE_TELEGRAM_ALERTS: env.ENABLE_TELEGRAM_ALERTS ?? null,
    ENABLE_NEAR_MISS_ALERTS: env.ENABLE_NEAR_MISS_ALERTS ?? null,
    ENABLE_IMBALANCE_ALERTS: env.ENABLE_IMBALANCE_ALERTS ?? null,
    NEAR_MISS_MIN_PNL_USD: env.NEAR_MISS_MIN_PNL_USD ?? null,
    IMBALANCE_ALERT_THRESHOLD_PCT: env.IMBALANCE_ALERT_THRESHOLD_PCT ?? null,
    MAX_ALERTS_PER_SCAN: env.MAX_ALERTS_PER_SCAN ?? null,
    TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN ? "***redacted***" : null,
    TELEGRAM_CHAT_ID: env.TELEGRAM_CHAT_ID ? "***redacted***" : null,
  };
}

function routes() {
  return [
    "GET /",
    "GET /health",
    "POST /scan",
    "GET /scan",
    "POST /scan/discovery",
    "POST /scan/baseline",
    "POST /scan/multihop",
    "POST /scan/internal",
    "GET /debug/pools",
    "GET /debug/config",
  ];
}

export function createRouter(env: Env) {
  return {
    async handle(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const method = request.method.toUpperCase();

      try {
        if (url.pathname === "/" && method === "GET") {
          return json({ ok: true, service: "neokta-arb-bot", routes: routes() });
        }

        if (url.pathname === "/health" && method === "GET") {
          return json({
            ok: true,
            service: "neokta-arb-bot",
            timestamp: new Date().toISOString(),
          });
        }

        if (url.pathname === "/scan" && (method === "GET" || method === "POST")) {
          const context = createScanContext(env);
          const result = await runFullScanWorkflow(context);
          return json({ ok: true, result });
        }

        if (url.pathname === "/scan/discovery" && method === "POST") {
          const context = createScanContext(env);
          const result = await runDiscoveryWorkflow(context);
          return json({ ok: true, scanId: context.scanId, result });
        }

        if (url.pathname === "/scan/baseline" && method === "POST") {
          const context = createScanContext(env);
          const discovery = await runDiscoveryWorkflow(context);
          const result = await runBaselineWorkflow(context, discovery, getDefaultSizeLadder());
          return json({ ok: true, scanId: context.scanId, result });
        }

        if (url.pathname === "/scan/multihop" && method === "POST") {
          const context = createScanContext(env);
          const discovery = await runDiscoveryWorkflow(context);
          const result = await runMultiHopWorkflow(context, discovery, getDefaultSizeLadder());
          return json({ ok: true, scanId: context.scanId, result });
        }

        if (url.pathname === "/scan/internal" && method === "POST") {
          const context = createScanContext(env);
          const discovery = await runDiscoveryWorkflow(context);
          const imbalance = await runImbalanceWorkflow(context, discovery);
          const result = await runInternalOpportunitiesWorkflow(
            context,
            discovery,
            imbalance,
            getDefaultSizeLadder()
          );
          return json({ ok: true, scanId: context.scanId, result });
        }

        if (url.pathname === "/debug/pools" && method === "GET") {
          const context = createScanContext(env);
          const discovery = await runDiscoveryWorkflow(context);
          return json({
            ok: true,
            scanId: context.scanId,
            summary: discovery.summary,
            routePools: discovery.routePools,
            usdcPools: discovery.usdcPools,
          });
        }

        if (url.pathname === "/debug/config" && method === "GET") {
          const context = createScanContext(env);
          return json({
            ok: true,
            scanId: context.scanId,
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
          error: error instanceof Error ? error.message : String(error),
        });

        return json(
          { ok: false, error: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      } finally {
        logInfo("http.request.completed", {
          method,
          path: url.pathname,
        });
      }
    },
  };
}
