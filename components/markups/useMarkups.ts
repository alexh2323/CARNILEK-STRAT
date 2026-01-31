"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { MarkupEntry, Screenshot, Timeframe } from "@/lib/markups/types"
import {
  loadMarkupsFromStorage,
  addMarkupToStorage,
  updateMarkupInStorage,
  deleteMarkupFromStorage,
} from "@/lib/markups/storage"

export function useMarkups() {
  const [entries, setEntries] = useState<MarkupEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Charger les données depuis Supabase au démarrage
  useEffect(() => {
    async function init() {
      try {
        console.log('Loading markups from Supabase...')
        const stored = await loadMarkupsFromStorage()
        const normalized = stored.map(normalizeEntry)
        setEntries(normalized)
        console.log(`Loaded ${normalized.length} entries`)
      } catch (err) {
        console.error('Error loading markups:', err)
        // Ne pas charger de données par défaut - juste laisser vide
        setEntries([])
      }
      setHydrated(true)
    }
    init()
  }, [])

  // Ajouter une entrée
  const addEntry = useCallback(async (entry: MarkupEntry) => {
    // D'abord sauvegarder sur Supabase
    const success = await addMarkupToStorage(entry)
    if (success) {
      // Puis mettre à jour l'état local
      setEntries((prev) => [entry, ...prev])
    } else {
      console.error('Failed to add entry to Supabase')
    }
  }, [])

  // Mettre à jour une entrée
  const updateEntry = useCallback(async (id: string, updater: (e: MarkupEntry) => MarkupEntry) => {
    let updatedEntry: MarkupEntry | null = null
    
    // Trouver et mettre à jour l'entrée
    setEntries((prev) => {
      return prev.map((e) => {
        if (e.id === id) {
          updatedEntry = updater(e)
          return updatedEntry
        }
        return e
      })
    })
    
    // Sauvegarder sur Supabase
    if (updatedEntry) {
      const success = await updateMarkupInStorage(updatedEntry)
      if (!success) {
        console.error('Failed to update entry in Supabase')
      }
    }
  }, [])

  // Supprimer une entrée
  const deleteEntry = useCallback(async (id: string) => {
    // D'abord supprimer de Supabase
    const success = await deleteMarkupFromStorage(id)
    if (success) {
      // Puis mettre à jour l'état local
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } else {
      console.error('Failed to delete entry from Supabase')
    }
  }, [])

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => (a.datetimeLocal < b.datetimeLocal ? 1 : -1))
  }, [entries])

  return {
    hydrated,
    entries: sortedEntries,
    setEntries,
    addEntry,
    updateEntry,
    deleteEntry,
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
