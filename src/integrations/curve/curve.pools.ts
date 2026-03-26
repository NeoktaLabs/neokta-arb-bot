// src/integrations/curve/curve.pools.ts

import type { ChainId } from "../../domain/chains";
import type { CurvePoolConfig } from "./curve.types";

const ETHERLINK_CURVE_POOLS: CurvePoolConfig[] = [
  { chainId: "etherlink", name: "Curve mBASIS/USDC", address: "0x0714027e44802b2ff76389daf5371990cc3a4c24" },
  { chainId: "etherlink", name: "Curve mRE7/USDC", address: "0x5d37f9b272ca7cda2a05245b9a503746eefac88f" },
  { chainId: "etherlink", name: "Curve stXTZ/WXTZ", address: "0x74d80ee400d3026fdd2520265cc98300710b25d4" },
  { chainId: "etherlink", name: "Curve mTBILL/USDC", address: "0x942644106b073e30d72c2c5d7529d5c296ea91ab" },
  { chainId: "etherlink", name: "Curve USDSM/USDC", address: "0x95af759ec2f4385edbbba959a8a1cdc65610d080" },
  { chainId: "etherlink", name: "Curve mMEV/USDC", address: "0x269b47978f4348c96f521658ef452ff85906fcfe" },
  { chainId: "etherlink", name: "Curve USDC/USDT", address: "0x2d84d79c852f6842abe0304b70bbaa1506add457" },
  { chainId: "etherlink", name: "Curve LBTC/WBTC", address: "0x1e8d78e9b3f0152d54d32904b7933f1cfe439df1" },
  { chainId: "etherlink", name: "Curve USDC/USDtz", address: "0xd5e41fcfbcf3a9cc4cc88fd4176106a24899d188" },
  { chainId: "etherlink", name: "Curve XU308/USDC", address: "0x3183f5956a7b8cbaacea34401e227af1c6df6d34" },
  { chainId: "etherlink", name: "Curve XU308/WXTZ", address: "0x8e3da27b6496ca4373ad8261835f56d0107c8e25" },
  { chainId: "etherlink", name: "Curve XU308/WBTC", address: "0xe080d14bf6ecec4c48ebe11055d4dea5dbc30e41" },
  { chainId: "etherlink", name: "Curve USDC/WXTZ", address: "0x78051fbf40581619ffaadb6cd7e5856d4a327a6d" },
];

const ETHEREUM_CURVE_POOLS: CurvePoolConfig[] = [];

export function getCurvePoolsForChain(chainId: ChainId): CurvePoolConfig[] {
  return chainId === "ethereum" ? ETHEREUM_CURVE_POOLS : ETHERLINK_CURVE_POOLS;
}
