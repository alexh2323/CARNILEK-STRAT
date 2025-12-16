export const ALLOWED_TIMEFRAMES = ["M5", "M15", "M30", "H1", "H4"] as const

export type Timeframe = (typeof ALLOWED_TIMEFRAMES)[number]

export type Screenshot = {
  id: string
  src: string
  timeframe: Timeframe
}

export type MarkupEntry = {
  id: string
  /**
   * ISO datetime (local) string, ex: 2025-12-16T09:15
   * (sans timezone volontairement; on reste “user local time”)
   */
  datetimeLocal: string
  /** Ex: "MSU", "EURUSD", "BTCUSD", "NQ", ... */
  symbol: string
  timeframe: Timeframe
  /** Ex: "Breakout", "Reversal", "Liquidity sweep", ... */
  strategy: string
  /** Notes libres */
  notes?: string
  /**
   * Captures d’écran (data URLs). Recommandé: webp compressé.
   * On supporte plusieurs images par entrée (jour), avec une UT par photo.
   */
  screenshots?: Screenshot[]
  /** Legacy: ancienne clé single image (compat) */
  screenshotDataUrl?: string
}


