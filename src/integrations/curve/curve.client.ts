// src/integrations/curve/curve.client.ts

import type { ChainId } from "../../domain/chain.types";
import type { Env, Address } from "../../domain/types";
import { getClient } from "../rpc/rpc.client";
import type { CurvePoolSnapshot, CurveTokenMetadata } from "./curve.types";

const CURVE_POOL_ABI = [
  {
    name: "coins",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "i", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "balances",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "i", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "get_dy",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "i", type: "int128" },
      { name: "j", type: "int128" },
      { name: "dx", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "get_dy",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "i", type: "uint256" },
      { name: "j", type: "uint256" },
      { name: "dx", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
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

async function readCoinAddress(
  env: Env,
  chainId: ChainId,
  poolAddress: Address,
  index: number
): Promise<Address | null> {
  const client = getClient(env, chainId);

  try {
    const address = await client.readContract({
      address: poolAddress,
      abi: CURVE_POOL_ABI,
      functionName: "coins",
      args: [BigInt(index)],
    });

    return address as Address;
  } catch {
    return null;
  }
}

async function readBalance(
  env: Env,
  chainId: ChainId,
  poolAddress: Address,
  index: number
): Promise<bigint | null> {
  const client = getClient(env, chainId);

  try {
    const balance = await client.readContract({
      address: poolAddress,
      abi: CURVE_POOL_ABI,
      functionName: "balances",
      args: [BigInt(index)],
    });

    return balance as bigint;
  } catch {
    return null;
  }
}

async function readCoinMetadata(
  env: Env,
  chainId: ChainId,
  tokenAddress: Address
): Promise<CurveTokenMetadata> {
  const client = getClient(env, chainId);

  const [symbol, decimals] = await Promise.all([
    client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "symbol",
    }),
    client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "decimals",
    }),
  ]);

  return {
    address: tokenAddress,
    symbol: String(symbol),
    decimals: Number(decimals),
  };
}

export async function getCurvePoolSnapshot(
  env: Env,
  chainId: ChainId,
  poolAddress: Address
): Promise<CurvePoolSnapshot> {
  const [coin0, coin1, coin2, balance0, balance1, balance2] = await Promise.all([
    readCoinAddress(env, chainId, poolAddress, 0),
    readCoinAddress(env, chainId, poolAddress, 1),
    readCoinAddress(env, chainId, poolAddress, 2),
    readBalance(env, chainId, poolAddress, 0),
    readBalance(env, chainId, poolAddress, 1),
    readBalance(env, chainId, poolAddress, 2),
  ]);

  if (!coin0 || !coin1 || balance0 === null || balance1 === null) {
    throw new Error(`Curve pool ${poolAddress} missing required coins/balances`);
  }

  const [token0, token1, token2] = await Promise.all([
    readCoinMetadata(env, chainId, coin0),
    readCoinMetadata(env, chainId, coin1),
    coin2 ? readCoinMetadata(env, chainId, coin2) : Promise.resolve(null),
  ]);

  return {
    poolAddress,
    tokens: token2 ? [token0, token1, token2] : [token0, token1],
    rawBalances: balance2 === null ? [balance0, balance1] : [balance0, balance1, balance2],
  };
}

export async function getCurveDyInt128(
  env: Env,
  chainId: ChainId,
  poolAddress: Address,
  i: number,
  j: number,
  dx: bigint
): Promise<bigint> {
  const client = getClient(env, chainId);

  const result = await client.readContract({
    address: poolAddress,
    abi: CURVE_POOL_ABI,
    functionName: "get_dy",
    args: [BigInt(i), BigInt(j), dx],
  });

  return result as bigint;
}

export async function getCurveDyUint256(
  env: Env,
  chainId: ChainId,
  poolAddress: Address,
  i: number,
  j: number,
  dx: bigint
): Promise<bigint> {
  const client = getClient(env, chainId);

  const result = await client.readContract({
    address: poolAddress,
    abi: CURVE_POOL_ABI,
    functionName: "get_dy",
    args: [BigInt(i), BigInt(j), dx],
  });

  return result as bigint;
}