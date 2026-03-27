// src/integrations/uniswap/uniswap.pools.ts

import type { UniswapPoolSeed } from "./uniswap.types";

export const ETHEREUM_UNISWAP_POOLS: UniswapPoolSeed[] = [
  // Stable triangle
  {
    name: "Uniswap USDC/USDT 0.01%",
    token0: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    token1: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    fee: 100,
  },
  {
    name: "Uniswap USDC/USDT 0.05%",
    token0: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    token1: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    fee: 500,
  },
  {
    name: "Uniswap DAI/USDC 0.01%",
    token0: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 100,
  },
  {
    name: "Uniswap DAI/USDC 0.05%",
    token0: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 500,
  },
  {
    name: "Uniswap DAI/USDT 0.01%",
    token0: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    token1: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    fee: 100,
  },

  // ETH connectors
  {
    name: "Uniswap USDC/WETH 0.05%",
    token0: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap USDC/WETH 0.3%",
    token0: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap USDT/WETH 0.05%",
    token0: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap USDT/WETH 0.3%",
    token0: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap DAI/WETH 0.05%",
    token0: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap DAI/WETH 0.3%",
    token0: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },

  // BTC connectors
  {
    name: "Uniswap WBTC/USDC 0.3%",
    token0: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap WBTC/WETH 0.3%",
    token0: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },

  // Extra stables / connectors
  {
    name: "Uniswap FRAX/USDC 0.05%",
    token0: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 500,
  },
  {
    name: "Uniswap FRAX/WETH 0.05%",
    token0: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap PYUSD/USDC 0.01%",
    token0: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 100,
  },

  // Liquid staking ETH
  {
    name: "Uniswap wstETH/WETH 0.01%",
    token0: "0x7f39c581f595b53c5cb5bbd66c9352e07dc9e6ae",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 100,
  },
  {
    name: "Uniswap wstETH/USDC 0.3%",
    token0: "0x7f39c581f595b53c5cb5bbd66c9352e07dc9e6ae",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap cbETH/WETH 0.05%",
    token0: "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap cbETH/USDC 0.3%",
    token0: "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap rETH/WETH 0.05%",
    token0: "0xae78736Cd615f374D3085123A210448E74Fc6393",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },

  // Meme coins
  {
    name: "Uniswap PEPE/WETH 0.3%",
    token0: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap SHIB/WETH 0.3%",
    token0: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
];