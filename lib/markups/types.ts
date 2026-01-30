export const ALLOWED_TIMEFRAMES = ["M5", "M15", "M30", "H1", "H4"] as const

export type Timeframe = (typeof ALLOWED_TIMEFRAMES)[number]

export const ALLOWED_CHARACTERISTICS = [
  "sorti_lit_cycle",
  "sorti_buildup",
  "prise_buildup",
  "msu_baissier",
  "msu_haussier",
] as const

export type Characteristic = (typeof ALLOWED_CHARACTERISTICS)[number]

export const CHARACTERISTIC_LABELS: Record<Characteristic, string> = {
  sorti_lit_cycle: "Sorti de lit cycle",
  sorti_buildup: "Sorti de buildup",
  prise_buildup: "Prise de build up",
  msu_baissier: "MSU baissier",
  msu_haussier: "MSU haussier",
}

export const ALLOWED_TRADE_RESULTS = ["TP1", "TP2", "TP3", "SL", "BE"] as const

export type TradeResult = (typeof ALLOWED_TRADE_RESULTS)[number]

export const TRADE_RESULT_LABELS: Record<TradeResult, string> = {
  TP1: "TP 1",
  TP2: "TP 2",
  TP3: "TP 3",
  SL: "Stop Loss",
  BE: "Break Even",
}

export const TRADE_RESULT_COLORS: Record<TradeResult, string> = {
  TP1: "bg-green-900/40 text-green-300 ring-green-800/50",
  TP2: "bg-green-900/60 text-green-200 ring-green-700/50",
  TP3: "bg-emerald-900/60 text-emerald-200 ring-emerald-700/50",
  SL: "bg-red-900/40 text-red-300 ring-red-800/50",
  BE: "bg-yellow-900/40 text-yellow-300 ring-yellow-800/50",
}

// Résultat individuel pour chaque partiel (TP1, TP2, TP3)
export const ALLOWED_PARTIAL_RESULTS = ["SL", "BE", "TP"] as const

export type PartialResult = (typeof ALLOWED_PARTIAL_RESULTS)[number]

export const PARTIAL_RESULT_COLORS: Record<PartialResult, string> = {
  SL: "bg-red-900/50 text-red-300",
  BE: "bg-yellow-900/50 text-yellow-300",
  TP: "bg-green-900/50 text-green-300",
}

export type Screenshot = {
  id: string
  src: string
  timeframe: Timeframe
}

export type MarkupEntry = {
  id: string
  /**
   * ISO datetime (local) string, ex: 2025-12-16T09:15
   * (sans timezone volontairement; on reste "user local time")
   */
  datetimeLocal: string
  /** Ex: "MSU" */
  symbol: string
  timeframe: Timeframe
  /** Ex: "Breakout", "Reversal", "Liquidity sweep", ... */
  strategy: string
  /** Caractéristiques du trade */
  characteristics?: Characteristic[]
  /** Résultat du trade: TP1, TP2, TP3, SL ou BE */
  tradeResult?: TradeResult
  /** Nombre total de pips */
  pips?: number
  /** Pips du partiel 1 (TP1) */
  pipsTP1?: number
  /** Résultat du TP1: SL, BE ou TP */
  resultTP1?: PartialResult
  /** Pips du partiel 2 (TP2) */
  pipsTP2?: number
  /** Résultat du TP2: SL, BE ou TP */
  resultTP2?: PartialResult
  /** Pips du partiel 3 (TP3) */
  pipsTP3?: number
  /** Résultat du TP3: SL, BE ou TP */
  resultTP3?: PartialResult
  /** Pips du Stop Loss */
  pipsSL?: number
  /** % du capital (ex: 2.5 pour +2.5%, -1 pour -1%) */
  capitalPct?: number
  /** Notes libres */
  notes?: string
  /**
   * Captures d'écran (data URLs). Recommandé: webp compressé.
   * On supporte plusieurs images par entrée (jour), avec une UT par photo.
   */
  screenshots?: Screenshot[]
  /** Legacy: ancienne clé single image (compat) */
  screenshotDataUrl?: string
}


