// src/integrations/curve/curve.pools.ts

import type { CurvePoolConfig } from "./curve.types";

export const CURVE_POOLS: CurvePoolConfig[] = [
  {
    name: "Example Pool",
    address: "0x78051fbf40581619ffaadb6cd7e5856d4a327a6d",
    coins: ["USDC", "WXTZ"], // index 0, 1
  },
];