// src/integrations/uniswap/uniswap.pools.ts

import type { UniswapPoolSeed } from "./uniswap.types";

export const ETHEREUM_UNISWAP_POOLS: UniswapPoolSeed[] = [
  // Stable / Stable
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
  {
    name: "Uniswap DAI/USDT 0.05%",
    token0: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    token1: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    fee: 500,
  },
  {
    name: "Uniswap FRAX/USDC 0.01%",
    token0: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 100,
  },
  {
    name: "Uniswap FRAX/USDC 0.05%",
    token0: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 500,
  },
  {
    name: "Uniswap FRAX/USDT 0.05%",
    token0: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    token1: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    fee: 500,
  },
  {
    name: "Uniswap LUSD/USDC 0.05%",
    token0: "0x5f98805A4E8be255a32880FDec7F6728C6568bA0",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 500,
  },
  {
    name: "Uniswap crvUSD/USDC 0.01%",
    token0: "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 100,
  },
  {
    name: "Uniswap PYUSD/USDC 0.01%",
    token0: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 100,
  },

  // WETH / Stable
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
  {
    name: "Uniswap FRAX/WETH 0.05%",
    token0: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap FRAX/WETH 0.3%",
    token0: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap LUSD/WETH 0.05%",
    token0: "0x5f98805A4E8be255a32880FDec7F6728C6568bA0",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap crvUSD/WETH 0.05%",
    token0: "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap PYUSD/WETH 0.05%",
    token0: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },

  // WBTC routes
  {
    name: "Uniswap WBTC/USDC 0.05%",
    token0: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 500,
  },
  {
    name: "Uniswap WBTC/USDC 0.3%",
    token0: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap WBTC/USDT 0.3%",
    token0: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    token1: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    fee: 3000,
  },
  {
    name: "Uniswap WBTC/WETH 0.05%",
    token0: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap WBTC/WETH 0.3%",
    token0: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap WBTC/DAI 0.3%",
    token0: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    token1: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    fee: 3000,
  },

  // Liquid staking / wrapped ETH
  {
    name: "Uniswap cbETH/WETH 0.05%",
    token0: "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap cbETH/WETH 0.3%",
    token0: "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap rETH/WETH 0.05%",
    token0: "0xae78736Cd615f374D3085123A210448E74Fc6393",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap rETH/WETH 0.3%",
    token0: "0xae78736Cd615f374D3085123A210448E74Fc6393",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap wstETH/WETH 0.01%",
    token0: "0x7f39c581f595b53c5cb5bbd66c9352e07dc9e6ae",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 100,
  },
  {
    name: "Uniswap wstETH/WETH 0.05%",
    token0: "0x7f39c581f595b53c5cb5bbd66c9352e07dc9e6ae",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap weETH/WETH 0.05%",
    token0: "0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap ezETH/WETH 0.05%",
    token0: "0xbf5495Efe5DB9ce00f80364C8B423567e58d2110",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 500,
  },
  {
    name: "Uniswap sfrxETH/WETH 0.05%",
    token0: "0xac3E018457B222d93114458476f3E3416Abbe38F",
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
    name: "Uniswap wstETH/USDC 0.3%",
    token0: "0x7f39c581f595b53c5cb5bbd66c9352e07dc9e6ae",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap rETH/USDC 0.3%",
    token0: "0xae78736Cd615f374D3085123A210448E74Fc6393",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },

  // Major DeFi / blue chips vs WETH
  {
    name: "Uniswap UNI/WETH 0.3%",
    token0: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap UNI/USDC 0.3%",
    token0: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap LINK/WETH 0.3%",
    token0: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap LINK/USDC 0.3%",
    token0: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap AAVE/WETH 0.3%",
    token0: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDAE9",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap AAVE/USDC 0.3%",
    token0: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDAE9",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap MKR/WETH 0.3%",
    token0: "0x9f8F72aA9304c8B593d555F12ef6589cC3A579A2",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap MKR/USDC 0.3%",
    token0: "0x9f8F72aA9304c8B593d555F12ef6589cC3A579A2",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap LDO/WETH 0.3%",
    token0: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap LDO/USDC 0.3%",
    token0: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap CRV/WETH 0.3%",
    token0: "0xD533a949740bb3306d119CC777fa900bA034cd52",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap CRV/USDC 0.3%",
    token0: "0xD533a949740bb3306d119CC777fa900bA034cd52",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap COMP/WETH 0.3%",
    token0: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap COMP/USDC 0.3%",
    token0: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap SNX/WETH 0.3%",
    token0: "0xC011A73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap SUSHI/WETH 0.3%",
    token0: "0x6B3595068778DD592e39A122f4f5a5Cf09C90fE2",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },

  // Newer majors / L2 governance tokens on Ethereum liquidity
  {
    name: "Uniswap ARB/WETH 0.3%",
    token0: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap ARB/USDC 0.3%",
    token0: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap OP/WETH 0.3%",
    token0: "0x4200000000000000000000000000000000000042",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap OP/USDC 0.3%",
    token0: "0x4200000000000000000000000000000000000042",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },

  // Popular majors vs WETH / USDC
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
  {
    name: "Uniswap MATIC/WETH 0.3%",
    token0: "0x7D1AfA7B718fb893dB30A3abc0Cfc608AaCfebb0",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap MATIC/USDC 0.3%",
    token0: "0x7D1AfA7B718fb893dB30A3abc0Cfc608AaCfebb0",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap ENS/WETH 0.3%",
    token0: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 3000,
  },
  {
    name: "Uniswap ENS/USDC 0.3%",
    token0: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
    token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fee: 3000,
  },
  {
    name: "Uniswap WETH/WEETH 0.3%",
    token0: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    token1: "0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee",
    fee: 3000,
  },

  // 1% fee tier for selected volatile pairs
  {
    name: "Uniswap UNI/WETH 1%",
    token0: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 10000,
  },
  {
    name: "Uniswap LINK/WETH 1%",
    token0: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 10000,
  },
  {
    name: "Uniswap AAVE/WETH 1%",
    token0: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDAE9",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 10000,
  },
  {
    name: "Uniswap MKR/WETH 1%",
    token0: "0x9f8F72aA9304c8B593d555F12ef6589cC3A579A2",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 10000,
  },
  {
    name: "Uniswap PEPE/WETH 1%",
    token0: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 10000,
  },
  {
    name: "Uniswap SHIB/WETH 1%",
    token0: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 10000,
  },
];