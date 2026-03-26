// src/integrations/oku/oku.client.ts

import type { Env } from "../../domain/types";
import { getClient } from "../etherlink/rpc.client";
import type { OkuPoolSnapshot, OkuPoolToken } from "./oku.types";

const OKU_POOL_ABI = [
  {
    name: "factory",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "token0",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "token1",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "fee",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint24" }],
  },
  {
    name: "liquidity",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint128" }],
  },
  {
    name: "slot0",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { type: "uint160", name: "sqrtPriceX96" },
      { type: "int24", name: "tick" },
      { type: "uint16", name: "observationIndex" },
      { type: "uint16", name: "observationCardinality" },
      { type: "uint16", name: "observationCardinalityNext" },
      { type: "uint8", name: "feeProtocol" },
      { type: "bool", name: "unlocked" },
    ],
  },
] as const;

const ERC20_ABI = [
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;

async function readTokenMetadata(
  env: Env,
  address: `0x${string}`
): Promise<OkuPoolToken> {
  const client = getClient(env);

  const [symbol, decimals] = await Promise.all([
    client.readContract({
      address,
      abi: ERC20_ABI,
      functionName: "symbol",
    }),
    client.readContract({
      address,
      abi: ERC20_ABI,
      functionName: "decimals",
    }),
  ]);

  return {
    address,
    symbol,
    decimals: Number(decimals),
  };
}

export async function readOkuPoolFactory(
  env: Env,
  poolAddress: `0x${string}`
): Promise<`0x${string}`> {
  const client = getClient(env);

  return client.readContract({
    address: poolAddress,
    abi: OKU_POOL_ABI,
    functionName: "factory",
  });
}

export async function getOkuPoolSnapshot(
  env: Env,
  poolAddress: `0x${string}`
): Promise<OkuPoolSnapshot> {
  const client = getClient(env);

  const [factory, token0Address, token1Address, fee, liquidity, slot0] =
    await Promise.all([
      client.readContract({
        address: poolAddress,
        abi: OKU_POOL_ABI,
        functionName: "factory",
      }),
      client.readContract({
        address: poolAddress,
        abi: OKU_POOL_ABI,
        functionName: "token0",
      }),
      client.readContract({
        address: poolAddress,
        abi: OKU_POOL_ABI,
        functionName: "token1",
      }),
      client.readContract({
        address: poolAddress,
        abi: OKU_POOL_ABI,
        functionName: "fee",
      }),
      client.readContract({
        address: poolAddress,
        abi: OKU_POOL_ABI,
        functionName: "liquidity",
      }),
      client.readContract({
        address: poolAddress,
        abi: OKU_POOL_ABI,
        functionName: "slot0",
      }),
    ]);

  const [token0, token1] = await Promise.all([
    readTokenMetadata(env, token0Address),
    readTokenMetadata(env, token1Address),
  ]);

  return {
    poolAddress,
    factory,
    token0,
    token1,
    fee: Number(fee),
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: Number(slot0[1]),
  };
}