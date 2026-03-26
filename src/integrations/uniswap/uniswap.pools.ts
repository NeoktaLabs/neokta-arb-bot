// src/integrations/uniswap/uniswap.pools.ts

import type { UniswapPoolSeed } from "./uniswap.types";

export const ETHEREUM_UNISWAP_POOLS: UniswapPoolSeed[] = [
  {
    name: "Uniswap USDC/WETH 0.05%",
    token0: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    token1: "0xc02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap USDC/WETH 0.3%",
    token0: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    token1: "0xc02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap USDC/USDT 0.01%",
    token0: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    token1: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    fee: 100,
  },
];
