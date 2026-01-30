export const ALLOWED_TIMEFRAMES = ["M5", "M15", "M30", "H1", "H4"] as const

export type Timeframe = (typeof ALLOWED_TIMEFRAMES)[number]

export const ALLOWED_CHARACTERISTICS = [
  "sorti_lit_cycle",
  "sorti_buildup",
  "prise_buildup",
] as const

export type Characteristic = (typeof ALLOWED_CHARACTERISTICS)[number]

export const CHARACTERISTIC_LABELS: Record<Characteristic, string> = {
  sorti_lit_cycle: "Sorti de lit cycle",
  sorti_buildup: "Sorti de buildup",
  prise_buildup: "Prise de build up",
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


