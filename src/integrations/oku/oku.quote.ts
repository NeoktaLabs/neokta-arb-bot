// src/integrations/oku/oku.quote.ts

import type { Env } from "../../domain/types";
import { getClient } from "../etherlink/rpc.client";
import { readOkuPoolFactory } from "./oku.client";

const QUOTER_V2_STRUCT_ABI = [
  {
    name: "quoteExactInputSingle",
    type: "function",
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
    name: "quoteExactInputSingle",
    type: "function",
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
    name: "factory",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "WETH9",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const;

export async function quoteOkuSwap(args: {
  env: Env;
  quoterAddress: `0x${string}`;
  poolAddress: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  fee: number;
  amountIn: bigint;
}): Promise<bigint> {
  const client = getClient(args.env);

  const [poolFactory, quoterState] = await Promise.all([
    readOkuPoolFactory(args.env, args.poolAddress).catch((error) => ({
      error: error instanceof Error ? error.message : String(error),
    })),
    (async () => {
      try {
        const [factory, weth9] = await Promise.all([
          client.readContract({
            address: args.quoterAddress,
            abi: QUOTER_STATE_ABI,
            functionName: "factory",
          }),
          client.readContract({
            address: args.quoterAddress,
            abi: QUOTER_STATE_ABI,
            functionName: "WETH9",
          }),
        ]);

        return { factory, weth9 };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })(),
  ]);

  try {
    const [amountOut] = await client.readContract({
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

    return amountOut;
  } catch (structError) {
    try {
      const amountOut = await client.readContract({
        address: args.quoterAddress,
        abi: QUOTER_CLASSIC_ABI,
        functionName: "quoteExactInputSingle",
        args: [args.tokenIn, args.tokenOut, args.fee, args.amountIn, 0n],
      });

      return amountOut;
    } catch (classicError) {
      throw new Error(
        JSON.stringify({
          message: "Oku quote failed for both signatures",
          quoterAddress: args.quoterAddress,
          poolAddress: args.poolAddress,
          tokenIn: args.tokenIn,
          tokenOut: args.tokenOut,
          fee: args.fee,
          amountIn: args.amountIn.toString(),
          poolFactory: "error" in poolFactory ? undefined : poolFactory,
          poolFactoryReadError: "error" in poolFactory ? poolFactory.error : undefined,
          quoterFactory: "error" in quoterState ? undefined : quoterState.factory,
          quoterWeth9: "error" in quoterState ? undefined : quoterState.weth9,
          quoterStateReadError: "error" in quoterState ? quoterState.error : undefined,
          structError: structError instanceof Error ? structError.message : String(structError),
          classicError: classicError instanceof Error ? classicError.message : String(classicError),
        })
      );
    }
  }
}