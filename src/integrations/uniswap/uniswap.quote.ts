// src/integrations/uniswap/uniswap.quote.ts

import type { Env } from "../../domain/types";
import { getClient } from "../etherlink/rpc.client";

const QUOTER_V2_STRUCT_ABI = [{ name:"quoteExactInputSingle", type:"function", stateMutability:"nonpayable", inputs:[{ name:"params", type:"tuple", components:[{name:"tokenIn",type:"address"},{name:"tokenOut",type:"address"},{name:"amountIn",type:"uint256"},{name:"fee",type:"uint24"},{name:"sqrtPriceLimitX96",type:"uint160"}] }], outputs:[{name:"amountOut",type:"uint256"},{name:"sqrtPriceX96After",type:"uint160"},{name:"initializedTicksCrossed",type:"uint32"},{name:"gasEstimate",type:"uint256"}] }] as const;
const QUOTER_CLASSIC_ABI = [{ name:"quoteExactInputSingle", type:"function", stateMutability:"nonpayable", inputs:[{name:"tokenIn",type:"address"},{name:"tokenOut",type:"address"},{name:"fee",type:"uint24"},{name:"amountIn",type:"uint256"},{name:"sqrtPriceLimitX96",type:"uint160"}], outputs:[{name:"amountOut",type:"uint256"}] }] as const;

export async function quoteUniswapSwap(args: { env: Env; quoterAddress: `0x${string}`; tokenIn: `0x${string}`; tokenOut: `0x${string}`; fee: number; amountIn: bigint; }): Promise<bigint> {
  const client = getClient(args.env, "ethereum");
  try {
    const [amountOut] = await client.readContract({ address: args.quoterAddress, abi: QUOTER_V2_STRUCT_ABI, functionName: "quoteExactInputSingle", args: [{ tokenIn: args.tokenIn, tokenOut: args.tokenOut, amountIn: args.amountIn, fee: args.fee, sqrtPriceLimitX96: 0n }] });
    return amountOut;
  } catch {
    return client.readContract({ address: args.quoterAddress, abi: QUOTER_CLASSIC_ABI, functionName: "quoteExactInputSingle", args: [args.tokenIn, args.tokenOut, args.fee, args.amountIn, 0n] });
  }
}
