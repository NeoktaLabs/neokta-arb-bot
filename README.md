# neokta-arb-bot

A Cloudflare-native arbitrage intelligence and monitoring system for on-chain liquidity markets.

---

## Overview

`neokta-arb-bot` is designed to monitor decentralized liquidity venues, identify pricing inefficiencies, simulate executable trade paths, and surface only meaningful opportunities.

The system focuses on realistic execution rather than theoretical price differences.

---

## Core Idea

All opportunities are evaluated as complete cycles:
input asset → route execution → output asset

The system only considers opportunities that remain valid after accounting for:
- fees
- slippage
- liquidity constraints
- route size

---

## Features

- Multi-venue pool monitoring
- Detection of pricing inconsistencies
- Multi-hop route discovery
- Full path simulation
- Profitability filtering
- Alerting integration
- Modular and extensible architecture

---

## Architecture

The project is organized into clear layers:

- **Adapters**: connect to external liquidity venues
- **Domain**: shared types and core models
- **Graph**: route discovery and path building
- **Simulator**: execution and profitability evaluation
- **Scanner**: orchestration of the full pipeline
- **Alerts**: external notification integrations
- **Storage**: caching and coordination
- **Clients**: RPC and external interfaces
- **Utils**: shared helpers

---

## Runtime

Built for a serverless environment using:

- Cloudflare Workers
- Scheduled execution (cron)
- KV storage
- Durable Objects