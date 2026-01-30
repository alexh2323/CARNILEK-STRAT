"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CalendarDays, ChevronRight, Clock } from "lucide-react"
import { useMemo, useState } from "react"
import { useMarkups } from "@/components/markups/useMarkups"
import { countByHour, getEntryMonth, getEntryYear, timeframeDistribution } from "@/lib/markups/metrics"
import { AppHeader } from "@/components/layout/AppHeader"
import { LabeledBars } from "@/components/ui/labeled-bars"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import type { TradeResult } from "@/lib/markups/types"

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

const MONTHS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]

export default function MarkupsYearPage() {
  const params = useParams()
  const year = Number(params.year)
  const { entries, hydrated } = useMarkups()

  const yearEntries = useMemo(() => entries.filter((e) => getEntryYear(e) === year), [entries, year])

  // Capital initial de l'année (modifiable)
  const [startingCapital, setStartingCapital] = useState<number>(200000)
  const [editingCapital, setEditingCapital] = useState(false)

  // Sélection de mois (null = toute l'année)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)

  // Stats réelles par mois basées sur les trades
  const monthlyStats = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
      const monthEntries = yearEntries.filter((e) => getEntryMonth(e) === m)
      
      let pct = 0
      let trades = 0
      let wins = 0
      let losses = 0
      
      for (const e of monthEntries) {
        if (e.capitalPct !== undefined) {
          pct += e.capitalPct
          trades++
          if (e.tradeResult === "TP1" || e.tradeResult === "TP2" || e.tradeResult === "TP3") {
            wins++
          } else if (e.tradeResult === "SL") {
            losses++
          }
        }
      }
      
      return {
        month: m,
        label: MONTHS_SHORT[m - 1],
        fullLabel: MONTHS_FR[m - 1],
        pct: Math.round(pct * 10) / 10,
        trades,
        wins,
        losses,
        winRate: trades > 0 ? Math.round((wins / trades) * 100) : 0
      }
    })
  }, [yearEntries])

  // Entrées filtrées par mois si sélectionné
  const filteredEntries = useMemo(() => {
    if (selectedMonth === null) return yearEntries
    return yearEntries.filter((e) => getEntryMonth(e) === selectedMonth)
  }, [yearEntries, selectedMonth])

  // Stats filtrées
  const filteredStats = useMemo(() => {
    const stats = { TP1: 0, TP2: 0, TP3: 0, BE: 0, SL: 0 }
    const beByPartial = { TP1: 0, TP2: 0 }
    const slByPartial = { TP1: 0, TP2: 0 }
    
    for (const e of filteredEntries) {
      if (e.tradeResult && e.tradeResult in stats) {
        stats[e.tradeResult as keyof typeof stats]++
      }
      if (e.resultTP1 === "BE") beByPartial.TP1++
      if (e.resultTP2 === "BE") beByPartial.TP2++
      if (e.resultTP1 === "SL") slByPartial.TP1++
      if (e.resultTP2 === "SL") slByPartial.TP2++
    }
    const total = stats.TP1 + stats.TP2 + stats.TP3 + stats.BE + stats.SL
    const wins = stats.TP1 + stats.TP2 + stats.TP3
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
    const totalBEPartials = beByPartial.TP1 + beByPartial.TP2
    const totalSLPartials = slByPartial.TP1 + slByPartial.TP2
    return { ...stats, total, wins, winRate, beByPartial, totalBEPartials, slByPartial, totalSLPartials }
  }, [filteredEntries])

  // Évolution du capital par mois
  const capitalEvolution = useMemo(() => {
    const data: Array<{ month: string; capital: number; pct: number; trades: number }> = []
    let currentCapital = startingCapital
    let cumulPct = 0
    let tradeCount = 0
    
    for (let m = 1; m <= 12; m++) {
      const monthEntries = (selectedMonth === null ? yearEntries : filteredEntries)
        .filter((e) => getEntryMonth(e) === m)
      
      for (const e of monthEntries) {
        if (e.capitalPct !== undefined) {
          cumulPct += e.capitalPct
          currentCapital = startingCapital * (1 + cumulPct / 100)
          tradeCount++
        }
      }
      
      if (tradeCount > 0 || data.length > 0) {
        data.push({
          month: MONTHS_SHORT[m - 1],
          capital: Math.round(currentCapital),
          pct: Math.round(cumulPct * 10) / 10,
          trades: tradeCount,
        })
      }
    }
    
    return data
  }, [yearEntries, filteredEntries, selectedMonth, startingCapital])

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

  const entriesByTf = useMemo(() => timeframeDistribution(filteredEntries), [filteredEntries])
  const hours = useMemo(() => countByHour(filteredEntries), [filteredEntries])
  const maxHour = Math.max(1, ...hours)

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

        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 sm:text-4xl">{year}</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/60 px-3 py-1.5 ring-1 ring-slate-800">
              {hydrated ? `${filteredEntries.length} entrées${selectedMonth !== null ? ` (${MONTHS_SHORT[selectedMonth - 1]})` : ""}` : "Chargement…"}
            </span>
          </div>
        </div>

        {/* Sélecteur de mois avec stats */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSelectedMonth(null)}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              selectedMonth === null
                ? "bg-slate-100 text-slate-900"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Toute l'année
          </button>
          {monthlyStats.map((m) => (
            <button
              key={m.month}
              onClick={() => setSelectedMonth(m.month)}
              className={`flex flex-col items-center rounded-lg px-3 py-2 text-sm font-medium transition min-w-[60px] ${
                selectedMonth === m.month
                  ? "bg-slate-100 text-slate-900"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span className="font-semibold text-xs">{m.label}</span>
              {m.trades > 0 ? (
                <span className={`text-[10px] mt-0.5 ${
                  m.pct > 0 
                    ? selectedMonth === m.month ? "text-green-700" : "text-green-400" 
                    : m.pct < 0 
                      ? selectedMonth === m.month ? "text-red-700" : "text-red-400"
                      : selectedMonth === m.month ? "text-slate-600" : "text-slate-500"
                }`}>
                  {m.pct > 0 ? "+" : ""}{m.pct}%
                </span>
              ) : (
                <span className={`text-[10px] mt-0.5 ${selectedMonth === m.month ? "text-slate-500" : "text-slate-600"}`}>—</span>
              )}
            </button>
          ))}
        </div>

        {/* Stats du résultat */}
        {filteredStats.total > 0 && (
          <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-100">
                Résultats {selectedMonth !== null ? `(${MONTHS_FR[selectedMonth - 1]})` : "de l'année"}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-green-900/40 px-3 py-1.5 text-sm font-semibold text-green-300">
                  TP1: {filteredStats.TP1} <span className="text-green-400/70">({filteredStats.total > 0 ? Math.round((filteredStats.TP1 / filteredStats.total) * 100) : 0}%)</span>
                </span>
                <span className="rounded-lg bg-green-900/40 px-3 py-1.5 text-sm font-semibold text-green-300">
                  TP2: {filteredStats.TP2} <span className="text-green-400/70">({filteredStats.total > 0 ? Math.round((filteredStats.TP2 / filteredStats.total) * 100) : 0}%)</span>
                </span>
                <span className="rounded-lg bg-green-900/40 px-3 py-1.5 text-sm font-semibold text-green-300">
                  TP3: {filteredStats.TP3} <span className="text-green-400/70">({filteredStats.total > 0 ? Math.round((filteredStats.TP3 / filteredStats.total) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="ml-auto flex items-center gap-3 text-sm">
                <span className="text-slate-400">
                  {filteredStats.wins}/{filteredStats.total} trades gagnants
                </span>
                <span className={`rounded-lg px-3 py-1.5 font-bold ${
                  filteredStats.winRate >= 50
                    ? "bg-green-900/40 text-green-300"
                    : "bg-red-900/40 text-red-300"
                }`}>
                  Win rate: {filteredStats.winRate}%
                </span>
              </div>
            </div>
            {/* BE et SL details */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="text-yellow-300">
                BE: {filteredStats.BE} ({filteredStats.total > 0 ? Math.round((filteredStats.BE / filteredStats.total) * 100) : 0}%)
                <span className="ml-2 text-[10px] text-yellow-400/60">[TP1: {filteredStats.beByPartial.TP1} • TP2: {filteredStats.beByPartial.TP2}]</span>
              </span>
              <span className="text-red-300">
                SL: {filteredStats.SL} ({filteredStats.total > 0 ? Math.round((filteredStats.SL / filteredStats.total) * 100) : 0}%)
                <span className="ml-2 text-[10px] text-red-400/60">[Full: {filteredStats.SL} • TP1: {filteredStats.slByPartial.TP1} • TP2: {filteredStats.slByPartial.TP2}]</span>
              </span>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between min-h-[52px]">
              <h2 className="text-lg font-semibold text-slate-100">Dossiers</h2>
              <div className="h-7 w-20" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {monthCards.map((m) => {
                const stats = monthlyStats[m.month - 1]
                return (
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
                        <div className={`text-xs font-semibold ${
                          stats.pct > 0 ? "text-green-400" : stats.pct < 0 ? "text-red-400" : "text-slate-400"
                        }`}>
                          {stats.trades > 0 ? `${stats.pct > 0 ? "+" : ""}${stats.pct}%` : "—"}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-100">ENTRÉES</h2>
              <div className="space-y-3">
                {entriesByTf.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune entrée</p>
                ) : entriesByTf.map((t) => (
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
              <LabeledBars data={monthlyStats} barWidth={38} height={96} />
            </section>
          </aside>
        </div>

        {/* Graphique évolution du capital */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Évolution du Capital</h2>
            <div className="flex items-center gap-3">
              {editingCapital ? (
                <input
                  type="number"
                  value={startingCapital}
                  onChange={(e) => setStartingCapital(Number(e.target.value))}
                  onBlur={() => setEditingCapital(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingCapital(false)}
                  autoFocus
                  className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-lg font-bold text-slate-100"
                />
              ) : (
                <button
                  onClick={() => setEditingCapital(true)}
                  className="text-2xl font-bold text-slate-100 hover:text-slate-200 transition"
                >
                  {(capitalEvolution.length > 0 ? capitalEvolution[capitalEvolution.length - 1].capital : startingCapital).toLocaleString()}€
                </button>
              )}
              {capitalEvolution.length > 0 && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
                  capitalEvolution[capitalEvolution.length - 1]?.pct >= 0 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {capitalEvolution[capitalEvolution.length - 1]?.pct > 0 ? "+" : ""}
                  {capitalEvolution[capitalEvolution.length - 1]?.pct || 0}%
                </span>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 hover:bg-slate-800 transition"
              >
                <span className="text-sm text-slate-300">
                  {selectedMonth !== null ? MONTHS_FR[selectedMonth - 1] : "Année"} {year}
                </span>
                <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showMonthDropdown ? "rotate-90" : ""}`} />
              </button>
              
              {showMonthDropdown && (
                <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl max-h-[400px] overflow-y-auto">
                  <button
                    onClick={() => { setSelectedMonth(null); setShowMonthDropdown(false); }}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                      selectedMonth === null ? "bg-slate-100 text-slate-900" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span>Toute l'année</span>
                    <span className="text-xs opacity-70">
                      {monthlyStats.reduce((sum, m) => sum + m.pct, 0).toFixed(1)}%
                    </span>
                  </button>
                  {monthlyStats.map((m) => (
                    <button
                      key={m.month}
                      onClick={() => { setSelectedMonth(m.month); setShowMonthDropdown(false); }}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                        selectedMonth === m.month ? "bg-slate-100 text-slate-900" : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>{m.fullLabel}</span>
                      <span className={`text-xs ${
                        m.pct > 0 ? "text-green-400" : m.pct < 0 ? "text-red-400" : "text-slate-500"
                      }`}>
                        {m.trades > 0 ? `${m.pct > 0 ? "+" : ""}${m.pct}%` : "—"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {capitalEvolution.length > 0 ? (
            <ChartContainer
              config={{
                capital: {
                  label: "Capital",
                  color: "#8b5cf6",
                },
              }}
              className="h-[250px] w-full"
            >
              <AreaChart data={capitalEvolution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="capitalGradientYear" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#475569" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  dx={-10}
                  domain={[
                    (dataMin: number) => Math.floor(Math.min(dataMin, startingCapital) * 0.95 / 1000) * 1000,
                    (dataMax: number) => Math.ceil(Math.max(dataMax, startingCapital) * 1.05 / 1000) * 1000
                  ]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="bg-slate-900 border-slate-700 shadow-xl"
                      labelFormatter={(value) => `${value}`}
                      formatter={(value, name, item) => (
                        <span className="text-slate-100">
                          {Number(value).toLocaleString()}€ ({item.payload.pct > 0 ? "+" : ""}{item.payload.pct}%)
                        </span>
                      )}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="capital"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#capitalGradientYear)"
                  dot={{ fill: "#8b5cf6", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-slate-500">
              Ajoute des trades avec le % capital pour voir l'évolution
            </div>
          )}
        </section>

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
