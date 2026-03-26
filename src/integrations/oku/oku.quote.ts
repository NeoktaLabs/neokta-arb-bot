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

type ReadOk<T> = {
  ok: true;
  value: T;
};

type ReadErr = {
  ok: false;
  error: string;
};

type ReadResult<T> = ReadOk<T> | ReadErr;

async function safeRead<T>(fn: () => Promise<T>): Promise<ReadResult<T>> {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

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

  const [poolFactoryResult, quoterFactoryResult, quoterWeth9Result] =
    await Promise.all([
      safeRead(() => readOkuPoolFactory(args.env, args.poolAddress)),
      safeRead(() =>
        client.readContract({
          address: args.quoterAddress,
          abi: QUOTER_STATE_ABI,
          functionName: "factory",
        })
      ),
      safeRead(() =>
        client.readContract({
          address: args.quoterAddress,
          abi: QUOTER_STATE_ABI,
          functionName: "WETH9",
        })
      ),
    ]);

  const structResult = await safeRead(async () => {
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
  });

  if (structResult.ok) {
    return structResult.value;
  }

  const classicResult = await safeRead(() =>
    client.readContract({
      address: args.quoterAddress,
      abi: QUOTER_CLASSIC_ABI,
      functionName: "quoteExactInputSingle",
      args: [args.tokenIn, args.tokenOut, args.fee, args.amountIn, 0n],
    })
  );

  if (classicResult.ok) {
    return classicResult.value;
  }

  throw new Error(
    JSON.stringify({
      message: "Oku quote failed for both signatures",
      quoterAddress: args.quoterAddress,
      poolAddress: args.poolAddress,
      tokenIn: args.tokenIn,
      tokenOut: args.tokenOut,
      fee: args.fee,
      amountIn: args.amountIn.toString(),

      poolFactory: poolFactoryResult.ok ? poolFactoryResult.value : undefined,
      poolFactoryReadError: poolFactoryResult.ok ? undefined : poolFactoryResult.error,

      quoterFactory: quoterFactoryResult.ok ? quoterFactoryResult.value : undefined,
      quoterFactoryReadError: quoterFactoryResult.ok
        ? undefined
        : quoterFactoryResult.error,

      quoterWeth9: quoterWeth9Result.ok ? quoterWeth9Result.value : undefined,
      quoterWeth9ReadError: quoterWeth9Result.ok
        ? undefined
        : quoterWeth9Result.error,

      structError: structResult.error,
      classicError: classicResult.error,
    })
  );
}