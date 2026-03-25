// src/domain/constants.ts

import type { Token } from "./types";

export const TOKENS: Record<string, Token> = {
  USDC: {
    symbol: "USDC",
    address: "0x...", // TODO: replace with real Etherlink USDC
    decimals: 6,
  },
  WXTZ: {
    symbol: "WXTZ",
    address: "0x...", // TODO
    decimals: 18,
  },
  STXTZ: {
    symbol: "stXTZ",
    address: "0x...", // TODO
    decimals: 18,
  },
};