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

export async function getCurvePoolSnapshot(
  env: Env,
  poolAddress: string
): Promise<CurvePoolSnapshot> {
  const client = getClient(env);

  const coinAddresses = await Promise.all([
    client.readContract({
      address: poolAddress as `0x${string}`,
      abi: POOL_ABI,
      functionName: "coins",
      args: [0n],
    }),
    client.readContract({
      address: poolAddress as `0x${string}`,
      abi: POOL_ABI,
      functionName: "coins",
      args: [1n],
    }),
  ]);

  const coins: CurvePoolCoin[] = await Promise.all(
    coinAddresses.map(async (coinAddress, index) => {
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
    })
  );

  return {
    poolAddress,
    coins,
  };
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