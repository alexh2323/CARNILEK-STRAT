import type { MarkupEntry } from "./types"

export const SAMPLE_MARKUPS: MarkupEntry[] = [
  {
    id: "seed-1",
    datetimeLocal: "2023-03-15T09:15",
    symbol: "MSU",
    timeframe: "M15",
    strategy: "Breakout",
    notes: "Cassure de range + retest. Confluence avec ouverture London.",
  },
  {
    id: "seed-2",
    datetimeLocal: "2023-03-15T14:35",
    symbol: "MSU",
    timeframe: "M15",
    strategy: "Liquidity sweep",
    notes: "Sweep du plus haut de session puis rejet.",
  },
  {
    id: "seed-3",
    datetimeLocal: "2023-03-21T10:05",
    symbol: "MSU",
    timeframe: "M5",
    strategy: "Reversal (M5)",
    notes: "Divergence + niveau H1.",
  },
  {
    id: "seed-4",
    datetimeLocal: "2024-01-13T15:10",
    symbol: "MSU",
    timeframe: "H1",
    strategy: "Trend continuation (H1)",
    notes: "Pullback sur MA + structure HL/HH.",
  },
]


