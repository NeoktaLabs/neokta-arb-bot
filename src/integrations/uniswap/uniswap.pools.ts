// src/integrations/uniswap/uniswap.pools.ts

import type { Address } from "../../domain/types";

export interface UniswapPoolConfig {
  address: Address;
  name: string;
}

export const ETHEREUM_UNISWAP_POOLS: UniswapPoolConfig[] = [
  {
    name: "Uniswap USDC/USDT 0.01%",
    address: "0x3416cF6C708Da44DB2624D63ea0AAef7113527C6",
  },
  {
    name: "Uniswap USDC/WETH 0.05%",
    address: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640",
  },
  {
    name: "Uniswap WBTC/USDC",
    address: "0x99ac8cA7087fA4A2A1FB6357269965A2014ABc35",
  },
];