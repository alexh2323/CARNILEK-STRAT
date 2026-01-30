"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { MarkupEntry, Screenshot, Timeframe } from "@/lib/markups/types"
import {
  loadMarkupsFromStorage,
  addMarkupToStorage,
  updateMarkupInStorage,
  deleteMarkupFromStorage,
  migrateLocalStorageToSupabase,
} from "@/lib/markups/storage"
import { SAMPLE_MARKUPS } from "@/lib/markups/sampleData"

export function useMarkups() {
  const [entries, setEntries] = useState<MarkupEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Charger les données au démarrage
  useEffect(() => {
    async function init() {
      try {
        // Migration automatique depuis localStorage (une seule fois)
        await migrateLocalStorageToSupabase()
        
        // Charger depuis Supabase
        const stored = await loadMarkupsFromStorage()
        if (stored.length > 0) {
          const normalized = stored.map(normalizeEntry)
          setEntries(normalized)
        } else {
          // Si aucune donnée, utiliser les exemples et les sauvegarder
          setEntries(SAMPLE_MARKUPS)
          // Sauvegarder les exemples dans Supabase
          for (const entry of SAMPLE_MARKUPS) {
            await addMarkupToStorage(entry)
          }
        }
      } catch (err) {
        console.error('Error loading markups:', err)
        setEntries(SAMPLE_MARKUPS)
      }
      setHydrated(true)
    }
    init()
  }, [])

  // Ajouter une entrée
  const addEntry = useCallback(async (entry: MarkupEntry) => {
    setEntries((prev) => [entry, ...prev])
    await addMarkupToStorage(entry)
  }, [])

  // Mettre à jour une entrée
  const updateEntry = useCallback(async (id: string, updater: (e: MarkupEntry) => MarkupEntry) => {
    let updatedEntry: MarkupEntry | null = null
    setEntries((prev) => {
      return prev.map((e) => {
        if (e.id === id) {
          updatedEntry = updater(e)
          return updatedEntry
        }
        return e
      })
    })
    if (updatedEntry) {
      await updateMarkupInStorage(updatedEntry)
    }
  }, [])

  // Supprimer une entrée
  const deleteEntry = useCallback(async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    await deleteMarkupFromStorage(id)
  }, [])

  // Setter compatible avec l'ancienne API (pour les composants existants)
  const setEntriesCompat = useCallback((updater: MarkupEntry[] | ((prev: MarkupEntry[]) => MarkupEntry[])) => {
    if (typeof updater === 'function') {
      setEntries((prev) => {
        const next = updater(prev)
        // Détecter les changements et synchroniser avec Supabase
        syncChanges(prev, next)
        return next
      })
    } else {
      setEntries((prev) => {
        syncChanges(prev, updater)
        return updater
      })
    }
  }, [])

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => (a.datetimeLocal < b.datetimeLocal ? 1 : -1))
  }, [entries])

  return {
    hydrated,
    entries: sortedEntries,
    setEntries: setEntriesCompat,
    addEntry,
    updateEntry,
    deleteEntry,
  }
}

// Synchroniser les changements avec Supabase
async function syncChanges(prev: MarkupEntry[], next: MarkupEntry[]) {
  const prevIds = new Set(prev.map((e) => e.id))
  const nextIds = new Set(next.map((e) => e.id))

  // Nouvelles entrées
  for (const entry of next) {
    if (!prevIds.has(entry.id)) {
      await addMarkupToStorage(entry)
    }
  }

  // Entrées supprimées
  for (const entry of prev) {
    if (!nextIds.has(entry.id)) {
      await deleteMarkupFromStorage(entry.id)
    }
  }

  // Entrées modifiées
  for (const nextEntry of next) {
    if (prevIds.has(nextEntry.id)) {
      const prevEntry = prev.find((e) => e.id === nextEntry.id)
      if (prevEntry && JSON.stringify(prevEntry) !== JSON.stringify(nextEntry)) {
        await updateMarkupInStorage(nextEntry)
      }
    }
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
