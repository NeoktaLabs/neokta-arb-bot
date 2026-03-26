// src/integrations/uniswap/uniswap.client.ts

import type { Env } from "../../domain/types";
import { getClient } from "../etherlink/rpc.client";
import type { UniswapPoolSnapshot, UniswapPoolToken } from "./uniswap.types";

const FACTORY_ABI = [{ name: "getPool", type: "function", stateMutability: "view", inputs: [{type:"address",name:"tokenA"},{type:"address",name:"tokenB"},{type:"uint24",name:"fee"}], outputs:[{type:"address"}] }] as const;
const POOL_ABI = [
  { name: "token0", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "token1", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "fee", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint24" }] },
  { name: "liquidity", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint128" }] },
  { name: "slot0", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint160" },{ type: "int24" },{ type: "uint16" },{ type: "uint16" },{ type: "uint16" },{ type: "uint8" },{ type: "bool" }] },
] as const;
const ERC20_ABI = [
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

async function readTokenMetadata(env: Env, address: `0x${string}`): Promise<UniswapPoolToken> {
  const client = getClient(env, "ethereum");
  const [symbol, decimals] = await Promise.all([
    client.readContract({ address, abi: ERC20_ABI, functionName: "symbol" }),
    client.readContract({ address, abi: ERC20_ABI, functionName: "decimals" }),
  ]);
  return { address, symbol, decimals: Number(decimals) };
}

export async function getUniswapPoolAddress(env: Env, factoryAddress: `0x${string}`, token0: `0x${string}`, token1: `0x${string}`, fee: number): Promise<`0x${string}`> {
  const client = getClient(env, "ethereum");
  return client.readContract({ address: factoryAddress, abi: FACTORY_ABI, functionName: "getPool", args: [token0, token1, fee] });
}

export async function getUniswapPoolSnapshot(env: Env, poolAddress: `0x${string}`): Promise<UniswapPoolSnapshot> {
  const client = getClient(env, "ethereum");
  const [token0Address, token1Address, fee, liquidity, slot0] = await Promise.all([
    client.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "token0" }),
    client.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "token1" }),
    client.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "fee" }),
    client.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "liquidity" }),
    client.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "slot0" }),
  ]);
  const [token0, token1] = await Promise.all([readTokenMetadata(env, token0Address), readTokenMetadata(env, token1Address)]);
  return { poolAddress, token0, token1, fee: Number(fee), liquidity, sqrtPriceX96: slot0[0], tick: Number(slot0[1]) };
}
