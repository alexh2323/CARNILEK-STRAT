import type { MarkupEntry } from "./types"
import { ALLOWED_TIMEFRAMES } from "./types"

export type ComboKey = `${string}__${string}`

export function getEntryYear(entry: MarkupEntry): number {
  return new Date(entry.datetimeLocal).getFullYear()
}

export function getEntryMonth(entry: MarkupEntry): number {
  return new Date(entry.datetimeLocal).getMonth() + 1
}

export function getEntryDay(entry: MarkupEntry): string {
  // YYYY-MM-DD
  return entry.datetimeLocal.slice(0, 10)
}

export function getEntryHour(entry: MarkupEntry): number {
  const d = new Date(entry.datetimeLocal)
  return d.getHours()
}

export function comboKey(entry: MarkupEntry): ComboKey {
  return `${entry.symbol.toUpperCase()}__${entry.timeframe}`
}

export function countByCombo(entries: MarkupEntry[]) {
  const map = new Map<ComboKey, number>()
  for (const e of entries) {
    const k = comboKey(e)
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return map
}

export function countByHour(entries: MarkupEntry[]) {
  const arr = Array.from({ length: 24 }, () => 0)
  for (const e of entries) {
    arr[getEntryHour(e)]++
  }
  return arr
}

export function topCombos(entries: MarkupEntry[], limit = 6) {
  const map = countByCombo(entries)
  const total = entries.length || 1
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => {
      const [symbol, timeframe] = key.split("__")
      return { symbol, timeframe, count, pct: (count / total) * 100 }
    })
}

export function topTimeframes(entries: MarkupEntry[], limit = 6) {
  const map = new Map<string, number>()
  for (const e of entries) {
    const tf = e.timeframe
    map.set(tf, (map.get(tf) ?? 0) + 1)
  }
  const total = entries.length || 1
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([timeframe, count]) => ({ timeframe, count, pct: (count / total) * 100 }))
}

export function timeframeDistribution(entries: MarkupEntry[]) {
  const map = new Map<string, number>()
  for (const e of entries) {
    map.set(e.timeframe, (map.get(e.timeframe) ?? 0) + 1)
  }
  const total = entries.length || 1
  return ALLOWED_TIMEFRAMES.map((timeframe) => {
    const count = map.get(timeframe) ?? 0
    return { timeframe, count, pct: (count / total) * 100 }
  })
}


