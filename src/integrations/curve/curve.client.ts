// src/integrations/curve/curve.client.ts

import { getClient } from "../etherlink/rpc.client";
import type { Env } from "../../domain/types";
import type { CurvePoolCoin, CurvePoolSnapshot } from "./curve.types";

const POOL_ABI = [
  {
    name: "coins",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "i", type: "uint256" }],
    outputs: [{ type: "address" }],
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
  poolAddress: string,
  index: number
): Promise<`0x${string}` | null> {
  const client = getClient(env);

  try {
    const address = await client.readContract({
      address: poolAddress as `0x${string}`,
      abi: POOL_ABI,
      functionName: "coins",
      args: [BigInt(index)],
    });

    return address;
  } catch {
    return null;
  }
}

async function readCoinMetadata(
  env: Env,
  coinAddress: `0x${string}`,
  index: number
): Promise<CurvePoolCoin | null> {
  const client = getClient(env);

  try {
    const [symbol, decimals] = await Promise.all([
      client.readContract({
        address: coinAddress,
        abi: ERC20_ABI,
        functionName: "symbol",
      }),
      client.readContract({
        address: coinAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
    ]);

    return {
      index,
      address: coinAddress,
      symbol,
      decimals: Number(decimals),
    };
  } catch {
    return null;
  }
}

export async function getCurvePoolSnapshot(
  env: Env,
  poolAddress: string
): Promise<CurvePoolSnapshot> {
  const coin0Address = await readCoinAddress(env, poolAddress, 0);
  const coin1Address = await readCoinAddress(env, poolAddress, 1);

  if (!coin0Address || !coin1Address) {
    throw new Error("Pool does not expose 2 readable coin slots");
  }

  const [coin0, coin1] = await Promise.all([
    readCoinMetadata(env, coin0Address, 0),
    readCoinMetadata(env, coin1Address, 1),
  ]);

  if (!coin0 || !coin1) {
    throw new Error("Failed to read coin metadata");
  }

  return {
    poolAddress,
    coins: [coin0, coin1],
  };
}

export async function hasThirdCoin(
  env: Env,
  poolAddress: string
): Promise<boolean> {
  const coin2 = await readCoinAddress(env, poolAddress, 2);
  return coin2 !== null;
}

export async function getCurveDy(
  env: Env,
  poolAddress: string,
  i: number,
  j: number,
  dx: bigint
): Promise<bigint> {
  const client = getClient(env);

  return client.readContract({
    address: poolAddress as `0x${string}`,
    abi: POOL_ABI,
    functionName: "get_dy",
    args: [BigInt(i), BigInt(j), dx],
  });
}