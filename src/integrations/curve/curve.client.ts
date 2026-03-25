// src/integrations/curve/curve.client.ts

import { getClient } from "../etherlink/rpc.client";
import type { Env } from "../../domain/types";

const ABI = [
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
    abi: ABI,
    functionName: "get_dy",
    args: [BigInt(i), BigInt(j), dx],
  });
}