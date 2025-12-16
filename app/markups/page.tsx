"use client"

import Link from "next/link"
import { ArrowLeft, ChevronRight, Clock } from "lucide-react"
import { useMemo } from "react"
import { useMarkups } from "@/components/markups/useMarkups"
import { countByHour, getEntryYear, timeframeDistribution } from "@/lib/markups/metrics"
import { AppHeader } from "@/components/layout/AppHeader"
import { YearlyBars } from "@/components/ui/yearly-bars"

export default function MarkupsPage() {
  const { hydrated, entries } = useMarkups()

  const yearCards = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    // 6 dossiers “visibles” par défaut: (année+1) → (année-4)
    const baseYears = Array.from({ length: 6 }, (_, i) => currentYear + 1 - i)
    // Années historiques demandées (toujours visibles)
    const legacyYears = [2020, 2019, 2018, 2017, 2016, 2015]
    const existingYears = new Set(entries.map(getEntryYear))
    const years = Array.from(new Set([...baseYears, ...legacyYears, ...existingYears])).sort((a, b) => b - a)

    const byYear = new Map<number, number>()
    for (const e of entries) {
      const y = getEntryYear(e)
      byYear.set(y, (byYear.get(y) ?? 0) + 1)
    }

    const total = entries.length || 0
    return years.map((y) => {
      const count = byYear.get(y) ?? 0
      const pct = total > 0 ? (count / total) * 100 : 0
      return { year: y, count, pct }
    })
  }, [entries])

  const entriesByTf = useMemo(() => timeframeDistribution(entries), [entries])
  const hours = useMemo(() => countByHour(entries), [entries])
  const maxHour = Math.max(1, ...hours)

  const yearlyGainsPct = useMemo(() => {
    // Données fictives pour le moment: % gains par année (2015 -> maintenant)
    const start = 2015
    const end = new Date().getFullYear()
    const arr: Array<{ year: number; pct: number }> = []
    for (let y = start; y <= end; y++) {
      if (y === 2015) {
        arr.push({ year: y, pct: 400 })
        continue
      }
      // valeurs déterministes et plausibles (à remplacer par tes vrais résultats)
      const t = Math.abs(Math.sin((y - start + 1) * 1.13) + Math.cos((y - start + 1) * 0.77))
      const pct = Math.round((60 + t * 220) / 10) * 10 // ~60..280 par pas de 10
      arr.push({ year: y, pct })
    }
    return arr
  }, [])

  return (
    <div className="flex min-h-screen flex-col text-slate-100">
      <AppHeader active="markups" />
      <main className="flex-1">
        <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-100 sm:text-4xl">Markups</h1>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
              <div className="mb-6 flex items-start justify-between min-h-[52px]">
                <h2 className="text-lg font-semibold text-slate-100">Dossiers</h2>
                {/* espace réservé pour garder la même hauteur qu'avant (sans afficher de compteur) */}
                <div className="h-7 w-20" aria-hidden="true" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {yearCards.map(({ year, count, pct }) => (
                  <Link
                    key={year}
                    href={`/markups/${year}`}
                    className="group rounded-2xl border border-slate-800 bg-slate-950/30 p-4 transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-950/50 hover:shadow-md min-h-[104px]"
                  >
                    <div className="flex h-full flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <p className="text-2xl font-semibold text-slate-100">{year}</p>
                        <ChevronRight className="mt-1 h-5 w-5 text-slate-500 transition group-hover:text-slate-200" />
                      </div>

                      {/* Infos: nombre de trades + % (toujours visibles) */}
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-slate-300">
                          {count} trades
                        </div>
                        <div className="text-xs font-semibold text-slate-300">
                          {pct.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-100">ENTRÉES</h2>
                <div className="space-y-3">
                  {entriesByTf.length === 0 ? (
                    <p className="text-sm text-slate-300">Aucune donnée pour le moment.</p>
                  ) : (
                    entriesByTf.map((t) => (
                      <div key={t.timeframe} className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-100 truncate">
                            {t.timeframe}
                          </p>
                          <p className="text-xs text-slate-300">
                            {t.count} entrées · {t.pct.toFixed(0)}%
                          </p>
                        </div>
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-slate-100"
                            style={{ width: `${Math.min(100, t.pct)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-100">GAINS (%)</h2>
                </div>
                <YearlyBars data={yearlyGainsPct} />
              </section>
            </aside>
          </div>

          {/* Heures (distribution) - pleine largeur, en dessous */}
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-300" />
              <h2 className="text-lg font-semibold text-slate-100">Heures (distribution)</h2>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[960px]">
                <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1">
                  {hours.map((count, hour) => (
                    <div
                      key={hour}
                      title={`${String(hour).padStart(2, "0")}h · ${count} entrées`}
                      className="flex h-12 items-end rounded-md bg-slate-950/40 p-1 ring-1 ring-slate-800"
                    >
                      <div
                        className="w-full rounded bg-slate-100"
                        style={{ height: `${Math.max(6, (count / maxHour) * 100)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1 text-[10px] text-slate-400">
                  {hours.map((_, hour) => (
                    <div key={hour} className="text-center">
                      {String(hour).padStart(2, "0")}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-300">
              On utilisera ça pour tracker tes heures les plus performantes (quand on stockera aussi les résultats de trades).
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
