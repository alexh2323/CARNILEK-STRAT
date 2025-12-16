import { ALLOWED_TIMEFRAMES, type MarkupEntry } from "./types"

const STORAGE_KEY = "trading:markups:v1"

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function isMarkupEntry(x: any): x is MarkupEntry {
  const isTf = (v: any) => (ALLOWED_TIMEFRAMES as readonly string[]).includes(String(v))
  const isScreenshots =
    typeof x?.screenshots === "undefined" ||
    (Array.isArray(x.screenshots) &&
      x.screenshots.every((s: any) => {
        // compat: ancien format string[]
        if (typeof s === "string") return true
        // nouveau format {id, src, timeframe}
        return (
          s &&
          typeof s === "object" &&
          typeof s.id === "string" &&
          typeof s.src === "string" &&
          isTf(s.timeframe)
        )
      }))
  return (
    x &&
    typeof x === "object" &&
    typeof x.id === "string" &&
    typeof x.datetimeLocal === "string" &&
    typeof x.symbol === "string" &&
    isTf(x.timeframe) &&
    typeof x.strategy === "string" &&
    (typeof x.notes === "undefined" || typeof x.notes === "string") &&
    (typeof x.screenshotDataUrl === "undefined" || typeof x.screenshotDataUrl === "string") &&
    isScreenshots
  )
}

export function loadMarkupsFromStorage(): MarkupEntry[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  const parsed = safeParse(raw)
  if (!Array.isArray(parsed)) return []
  return parsed.filter(isMarkupEntry)
}

export function saveMarkupsToStorage(entries: MarkupEntry[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // si localStorage est plein (photos), on évite de casser l'app.
    // On gérera une vraie persistance (IndexedDB) plus tard.
  }
}


