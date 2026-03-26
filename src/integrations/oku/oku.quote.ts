// src/integrations/oku/oku.quote.ts

import type { Env } from "../../domain/types";
import { getClient } from "../etherlink/rpc.client";

const QUOTER_V2_STRUCT_ABI = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
] as const;

const QUOTER_CLASSIC_ABI = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "amountIn", type: "uint256" },
      { name: "sqrtPriceLimitX96", type: "uint160" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

const QUOTER_STATE_ABI = [
  {
    type: "function",
    name: "factory",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "WETH9",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const;

export type OkuQuoteArgs = {
  env: Env;
  quoterAddress: `0x${string}`;
  poolAddress: `0x${string}`;
  poolFactory?: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  fee: number;
  amountIn: bigint;
};

async function readQuoterState(env: Env, quoterAddress: `0x${string}`) {
  const client = getClient(env);

  try {
    const [factory, weth9] = await Promise.all([
      client.readContract({
        address: quoterAddress,
        abi: QUOTER_STATE_ABI,
        functionName: "factory",
      }),
      client.readContract({
        address: quoterAddress,
        abi: QUOTER_STATE_ABI,
        functionName: "WETH9",
      }),
    ]);

    return { factory, weth9 };
  } catch (error) {
    return {
      factory: undefined,
      weth9: undefined,
      readError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function tryStructQuote(args: OkuQuoteArgs): Promise<bigint> {
  const client = getClient(args.env);

  const result = await client.readContract({
    address: args.quoterAddress,
    abi: QUOTER_V2_STRUCT_ABI,
    functionName: "quoteExactInputSingle",
    args: [
      {
        tokenIn: args.tokenIn,
        tokenOut: args.tokenOut,
        amountIn: args.amountIn,
        fee: args.fee,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });

  return result[0];
}

async function tryClassicQuote(args: OkuQuoteArgs): Promise<bigint> {
  const client = getClient(args.env);

  return await client.readContract({
    address: args.quoterAddress,
    abi: QUOTER_CLASSIC_ABI,
    functionName: "quoteExactInputSingle",
    args: [args.tokenIn, args.tokenOut, args.fee, args.amountIn, 0n],
  });
}

export async function quoteOkuSwap(args: OkuQuoteArgs): Promise<bigint> {
  const quoterState = await readQuoterState(args.env, args.quoterAddress);
  const attempts: Array<{ shape: "v2-struct" | "classic"; error: string }> = [];

  try {
    return await tryStructQuote(args);
  } catch (error) {
    attempts.push({
      shape: "v2-struct",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    return await tryClassicQuote(args);
  } catch (error) {
    attempts.push({
      shape: "classic",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  throw new Error(
    JSON.stringify({
      message: "Oku quote failed for both signatures",
      quoterAddress: args.quoterAddress,
      quoterFactory: quoterState.factory,
      quoterWeth9: quoterState.weth9,
      quoterStateReadError: "readError" in quoterState ? quoterState.readError : undefined,
      poolAddress: args.poolAddress,
      poolFactory: args.poolFactory,
      tokenIn: args.tokenIn,
      tokenOut: args.tokenOut,
      fee: args.fee,
      amountIn: args.amountIn.toString(),
      attempts,
    })
  );
}