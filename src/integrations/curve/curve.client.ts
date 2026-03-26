// src/integrations/curve/curve.client.ts

import type { ChainId } from "../../domain/chains";
import type { Env } from "../../domain/types";
import { getClient } from "../etherlink/rpc.client";
import type { CurvePoolCoin, CurvePoolSnapshot } from "./curve.types";

const POOL_COINS_ABI = [
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
] as const;

const GET_DY_INT128_ABI = [
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

const GET_DY_UINT256_ABI = [
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
  poolAddress: `0x${string}`,
  index: number
): Promise<`0x${string}` | null> {
  const client = getClient(env, chainId);

  try {
    const address = await client.readContract({
      address: poolAddress,
      abi: POOL_COINS_ABI,
      functionName: "coins",
      args: [BigInt(index)],
    });

    return address;
  } catch {
    return null;
  }
}

async function readBalance(
  env: Env,
  chainId: ChainId,
  poolAddress: `0x${string}`,
  index: number,
  decimals: number
): Promise<number> {
  const client = getClient(env, chainId);

  const rawBalance = await client.readContract({
    address: poolAddress,
    abi: POOL_COINS_ABI,
    functionName: "balances",
    args: [BigInt(index)],
  });

  return Number(rawBalance) / 10 ** decimals;
}

async function readCoinMetadata(
  env: Env,
  chainId: ChainId,
  coinAddress: `0x${string}`,
  index: number
): Promise<CurvePoolCoin | null> {
  const client = getClient(env, chainId);

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
  chainId: ChainId,
  poolAddress: `0x${string}`
): Promise<CurvePoolSnapshot> {
  const coin0Address = await readCoinAddress(env, chainId, poolAddress, 0);
  const coin1Address = await readCoinAddress(env, chainId, poolAddress, 1);

  if (!coin0Address || !coin1Address) {
    throw new Error(`Unable to read first two Curve coins for ${poolAddress}`);
  }

  const [coin0, coin1] = await Promise.all([
    readCoinMetadata(env, chainId, coin0Address, 0),
    readCoinMetadata(env, chainId, coin1Address, 1),
  ]);

  if (!coin0 || !coin1) {
    throw new Error(`Unable to read metadata for required Curve coins in ${poolAddress}`);
  }

  const coin2Address = await readCoinAddress(env, chainId, poolAddress, 2);
  const coin2 = coin2Address
    ? await readCoinMetadata(env, chainId, coin2Address, 2)
    : null;

  const coins = coin2 ? [coin0, coin1, coin2] : [coin0, coin1];

  const balances = await Promise.all(
    coins.map((coin, index) => readBalance(env, chainId, poolAddress, index, coin.decimals))
  );

  return {
    poolAddress,
    coins,
    balances,
  };
}

export async function hasThirdCoin(
  env: Env,
  chainId: ChainId,
  poolAddress: `0x${string}`
): Promise<boolean> {
  const coin2 = await readCoinAddress(env, chainId, poolAddress, 2);
  return Boolean(coin2);
}

export async function getCurveDyInt128(
  env: Env,
  chainId: ChainId,
  poolAddress: `0x${string}`,
  i: number,
  j: number,
  dx: bigint
): Promise<bigint> {
  const client = getClient(env, chainId);

  return client.readContract({
    address: poolAddress,
    abi: GET_DY_INT128_ABI,
    functionName: "get_dy",
    args: [BigInt(i), BigInt(j), dx],
  });
}

export async function getCurveDyUint256(
  env: Env,
  chainId: ChainId,
  poolAddress: `0x${string}`,
  i: number,
  j: number,
  dx: bigint
): Promise<bigint> {
  const client = getClient(env, chainId);

  return client.readContract({
    address: poolAddress,
    abi: GET_DY_UINT256_ABI,
    functionName: "get_dy",
    args: [BigInt(i), BigInt(j), dx],
  });
}