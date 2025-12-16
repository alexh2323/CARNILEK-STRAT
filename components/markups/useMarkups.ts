"use client"

import { useEffect, useMemo, useState } from "react"
import type { MarkupEntry, Screenshot, Timeframe } from "@/lib/markups/types"
import { loadMarkupsFromStorage, saveMarkupsToStorage } from "@/lib/markups/storage"
import { SAMPLE_MARKUPS } from "@/lib/markups/sampleData"

export function useMarkups() {
  const [entries, setEntries] = useState<MarkupEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadMarkupsFromStorage()
    if (stored.length > 0) {
      // Normalisation (compat):
      // - screenshotDataUrl -> screenshots[]
      // - screenshots: string[] -> screenshots: Screenshot[]
      const normalized = stored.map(normalizeEntry)
      setEntries(normalized)
    } else {
      setEntries(SAMPLE_MARKUPS)
      saveMarkupsToStorage(SAMPLE_MARKUPS)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveMarkupsToStorage(entries)
  }, [entries, hydrated])

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => (a.datetimeLocal < b.datetimeLocal ? 1 : -1))
  }, [entries])

  return {
    hydrated,
    entries: sortedEntries,
    setEntries,
  }
}

function normalizeEntry(e: MarkupEntry): MarkupEntry {
  const mkId = (src: string, i: number) =>
    `${e.id}-shot-${i}-${src.length}`

  const toShot = (src: string, i: number): Screenshot => ({
    id: mkId(src, i),
    src,
    timeframe: e.timeframe as Timeframe,
  })

  const shots: Screenshot[] = []
  const raw = (e as any).screenshots

  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const s = raw[i]
      if (typeof s === "string") {
        shots.push(toShot(s, i))
      } else if (s && typeof s === "object" && typeof s.src === "string" && typeof s.timeframe === "string") {
        shots.push({
          id: typeof s.id === "string" ? s.id : mkId(s.src, i),
          src: s.src,
          timeframe: s.timeframe as Timeframe,
        })
      }
    }
  }

  if (shots.length === 0 && e.screenshotDataUrl) {
    shots.push(toShot(e.screenshotDataUrl, 0))
  }

  return {
    ...e,
    screenshots: shots.length ? shots : undefined,
  }
}


