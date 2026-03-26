// src/integrations/curve/curve.pools.ts

import type { Address } from "../../domain/types";
import type { ChainId } from "../../domain/chain.types";

export interface CurvePoolConfig {
  address: Address;
  name: string;
}

const ETHERLINK_CURVE_POOLS: CurvePoolConfig[] = [
  {
    name: "Curve USDC/USDT",
    address: "0x4d14b24EDb751221B3Ff08BBB8bd91D4b1c8bc77",
  },
  {
    name: "Curve USDC/WXTZ",
    address: "0x22E80bc11a3d3e7Ff4916B12a4f1c6c7C4d3A6D6",
  },
  {
    name: "Curve USDC/USDtz",
    address: "0x4C9Bf2Ff7A06E4E0aB1f7d4b1f58D7d4A76f5A60",
  },
  {
    name: "Curve XU308/USDC",
    address: "0xA4D64f4f4A8d0e9b2f1f94d7A4e4E7D7b8b4C2D1",
  },
  {
    name: "Curve mBASIS/USDC",
    address: "0x6f6F2D4f5f9A6A4c3b2d1c7E6b5f4e3d2c1b0a98",
  },
  {
    name: "Curve mRE7/USDC",
    address: "0x7b7A3e2d1c4f5a6b7c8d9e0f1a2b3c4d5e6f7081",
  },
  {
    name: "Curve mTBILL/USDC",
    address: "0x8c8B4f3e2d5a6b7c8d9e0f1a2b3c4d5e6f708192",
  },
  {
    name: "Curve USDSM/USDC",
    address: "0x9d9C5a4f3e6b7c8d9e0f1a2b3c4d5e6f708193a3",
  },
  {
    name: "Curve mMEV/USDC",
    address: "0xaeAd6b5a4f7c8d9e0f1a2b3c4d5e6f708194b4b4",
  },
];

const ETHEREUM_CURVE_POOLS: CurvePoolConfig[] = [];

export function getCurvePoolsForChain(chainId: ChainId): CurvePoolConfig[] {
  return chainId === "ethereum" ? ETHEREUM_CURVE_POOLS : ETHERLINK_CURVE_POOLS;
}