"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CalendarDays, ChevronRight, Clock } from "lucide-react"
import { useMemo } from "react"
import { useMarkups } from "@/components/markups/useMarkups"
import { countByHour, getEntryMonth, getEntryYear, timeframeDistribution } from "@/lib/markups/metrics"
import { AppHeader } from "@/components/layout/AppHeader"
import { LabeledBars } from "@/components/ui/labeled-bars"

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

export default function MarkupsYearPage() {
  const params = useParams()
  const year = Number(params.year)
  const { entries } = useMarkups()

  const yearEntries = useMemo(() => entries.filter((e) => getEntryYear(e) === year), [entries, year])

  const monthCards = useMemo(() => {
    const byMonth = new Map<number, number>()
    for (const e of yearEntries) {
      const m = getEntryMonth(e)
      byMonth.set(m, (byMonth.get(m) ?? 0) + 1)
    }
    return Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
      month: m,
      label: MONTHS_FR[m - 1],
      count: byMonth.get(m) ?? 0,
    }))
  }, [yearEntries])

  const entriesByTf = useMemo(() => timeframeDistribution(yearEntries), [yearEntries])
  const hours = useMemo(() => countByHour(yearEntries), [yearEntries])
  const maxHour = Math.max(1, ...hours)

  const monthGainsPct = useMemo(() => {
    // fictif: gains % par mois (01..12)
    const arr: Array<{ label: string; pct: number }> = []
    for (let m = 1; m <= 12; m++) {
      const t = Math.abs(Math.sin((year - 2015 + 1) * 0.37 + m * 0.9) + Math.cos(m * 0.55))
      const pct = Math.round((40 + t * 180) / 10) * 10
      arr.push({ label: String(m).padStart(2, "0"), pct })
    }
    return arr
  }, [year])

  return (
    <div className="min-h-screen text-slate-100">
      <AppHeader active="markups" />
      <main className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/markups"
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux années
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-slate-800">
            <CalendarDays className="h-4 w-4 text-slate-300" />
            Année {year}
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 sm:text-4xl">{year}</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between min-h-[52px]">
              <h2 className="text-lg font-semibold text-slate-100">Dossiers</h2>
              <div className="h-7 w-20" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {monthCards.map((m) => (
                <Link
                  key={m.month}
                  href={`/markups/${year}/${String(m.month).padStart(2, "0")}`}
                  className="group rounded-2xl border border-slate-800 bg-slate-950/30 p-4 transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-950/50 hover:shadow-md min-h-[104px]"
                >
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <p className="text-lg font-semibold text-slate-100">{m.label}</p>
                      <ChevronRight className="mt-1 h-5 w-5 text-slate-500 transition group-hover:text-slate-200" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-slate-300">{m.count} trades</div>
                      <div className="text-xs font-semibold text-slate-300">
                        {yearEntries.length > 0 ? ((m.count / yearEntries.length) * 100).toFixed(0) : "0"}%
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
                {entriesByTf.map((t) => (
                  <div key={t.timeframe} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">{t.timeframe}</p>
                      <p className="text-xs text-slate-300">
                        {t.count} entrées · {t.pct.toFixed(0)}%
                      </p>
                    </div>
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-slate-100" style={{ width: `${Math.min(100, t.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">GAINS (%)</h2>
              </div>
              <LabeledBars data={monthGainsPct} />
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
        </section>
      </main>
    </div>
  )
}

