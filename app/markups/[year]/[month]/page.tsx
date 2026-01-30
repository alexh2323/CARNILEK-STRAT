"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useMarkups } from "@/components/markups/useMarkups"
import { ALLOWED_TIMEFRAMES, ALLOWED_CHARACTERISTICS, CHARACTERISTIC_LABELS, ALLOWED_TRADE_RESULTS, TRADE_RESULT_LABELS, TRADE_RESULT_COLORS, ALLOWED_PARTIAL_RESULTS, PARTIAL_RESULT_COLORS, type MarkupEntry, type Screenshot, type Timeframe, type Characteristic, type TradeResult, type PartialResult } from "@/lib/markups/types"
import { countByHour, getEntryDay, getEntryMonth, getEntryYear, timeframeDistribution } from "@/lib/markups/metrics"
import { AppHeader } from "@/components/layout/AppHeader"
import { LabeledBars } from "@/components/ui/labeled-bars"
import { fileToCompressedDataUrl } from "@/lib/images/toDataUrl"

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
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

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function ymd(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function firstScreenshot(entry: MarkupEntry) {
  return entry.screenshots?.[0]?.src || entry.screenshotDataUrl
}

function mondayIndex(jsDay: number) {
  // JS: 0=Dim ... 6=Sam -> 0=Lun ... 6=Dim
  return (jsDay + 6) % 7
}

function buildMonthWeeks(year: number, month1to12: number) {
  const first = new Date(year, month1to12 - 1, 1)
  const last = new Date(year, month1to12, 0)
  const start = new Date(first)
  start.setDate(first.getDate() - mondayIndex(first.getDay()))
  const end = new Date(last)
  end.setDate(last.getDate() + (6 - mondayIndex(last.getDay())))

  const weeks: Date[][] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

const TIMEFRAMES: Timeframe[] = [...ALLOWED_TIMEFRAMES]

export default function MarkupsMonthPage() {
  const params = useParams()
  const year = Number(params.year)
  const month = Number(params.month) // "03" -> 3

  const { hydrated, entries, setEntries } = useMarkups()

  const monthEntries = useMemo(() => {
    return entries.filter((e) => getEntryYear(e) === year && getEntryMonth(e) === month)
  }, [entries, year, month])

  const entriesByDay = useMemo(() => {
    const map = new Map<string, MarkupEntry[]>()
    for (const e of monthEntries) {
      const key = getEntryDay(e)
      const prev = map.get(key) ?? []
      prev.push(e)
      map.set(key, prev)
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => (a.datetimeLocal < b.datetimeLocal ? -1 : 1))
      map.set(k, list)
    }
    return map
  }, [monthEntries])

  const weeks = useMemo(() => buildMonthWeeks(year, month), [year, month])

  const entriesByTf = useMemo(() => timeframeDistribution(monthEntries), [monthEntries])
  const hours = useMemo(() => countByHour(monthEntries), [monthEntries])
  const maxHour = Math.max(1, ...hours)

  // Stats des résultats du mois
  const resultStats = useMemo(() => {
    const stats = { TP1: 0, TP2: 0, TP3: 0, BE: 0, SL: 0 }
    // Compteur BE et SL par niveau de partiel
    const beByPartial = { TP1: 0, TP2: 0 }
    const slByPartial = { TP1: 0, TP2: 0 }
    
    for (const e of monthEntries) {
      if (e.tradeResult && e.tradeResult in stats) {
        stats[e.tradeResult as keyof typeof stats]++
      }
      // Compter les BE par partiel
      if (e.resultTP1 === "BE") beByPartial.TP1++
      if (e.resultTP2 === "BE") beByPartial.TP2++
      // Compter les SL par partiel
      if (e.resultTP1 === "SL") slByPartial.TP1++
      if (e.resultTP2 === "SL") slByPartial.TP2++
    }
    const total = stats.TP1 + stats.TP2 + stats.TP3 + stats.BE + stats.SL
    const wins = stats.TP1 + stats.TP2 + stats.TP3
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
    const totalBEPartials = beByPartial.TP1 + beByPartial.TP2
    const totalSLPartials = slByPartial.TP1 + slByPartial.TP2
    return { ...stats, total, wins, winRate, beByPartial, totalBEPartials, slByPartial, totalSLPartials }
  }, [monthEntries])

  const weekGainsPct = useMemo(() => {
    // fictif: gains % par semaine (W1..Wn) basé sur le nombre de semaines affichées
    const arr: Array<{ label: string; pct: number }> = []
    const n = weeks.length
    for (let i = 0; i < n; i++) {
      const t = Math.abs(Math.sin((year - 2015 + 1) * 0.21 + (month + 1) * 0.7 + i * 0.9) + Math.cos(i * 0.6))
      const pct = Math.round((20 + t * 120) / 10) * 10
      arr.push({ label: `W${i + 1}`, pct })
    }
    return arr
  }, [weeks.length, year, month])

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const selectedList = selectedDay ? entriesByDay.get(selectedDay) ?? [] : []

  const openDay = (dayKey: string) => setSelectedDay(dayKey)
  const closeDay = () => setSelectedDay(null)

  const addEntry = (entry: MarkupEntry) => {
    setEntries((prev) => [entry, ...prev])
  }

  const updateEntry = (id: string, updater: (e: MarkupEntry) => MarkupEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? updater(e) : e)))
  }

  return (
    <div className="min-h-screen text-slate-100">
      <AppHeader active="markups" />
      <main className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/markups/${year}`}
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à {year}
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-slate-800">
            <CalendarDays className="h-4 w-4 text-slate-300" />
            {MONTHS_FR[month - 1]} {year}
          </div>
        </div>

        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 sm:text-4xl">
              {MONTHS_FR[month - 1]} {year}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/60 px-3 py-1.5 ring-1 ring-slate-800">
              {hydrated ? `${monthEntries.length} entrées ce mois` : "Chargement…"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Calendrier</h2>
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                <ChevronLeft className="h-4 w-4" />
                <span>semaines</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {DAYS_FR.map((d) => (
                <div key={d} className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-rows-1 gap-2">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-2">
                  {week.map((date) => {
                    const key = ymd(date)
                    const inMonth = date.getMonth() === month - 1
                    const list = entriesByDay.get(key) ?? []
                    const thumb = list.map(firstScreenshot).find(Boolean)

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => openDay(key)}
                        className={[
                          "relative h-24 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
                          inMonth
                            ? "border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-950/60 hover:shadow-sm"
                            : "border-slate-900/60 bg-slate-950/10 text-slate-500",
                          selectedDay === key ? "ring-2 ring-slate-200" : "",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between">
                          <span className={inMonth ? "text-sm font-semibold text-slate-100" : "text-sm font-semibold"}>
                            {date.getDate()}
                          </span>
                          {list.length > 0 && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-950">
                              {list.length}
                            </span>
                          )}
                        </div>

                        <div className="mt-2">
                          {thumb ? (
                            <div className="h-10 w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={thumb} alt="capture" className="h-full w-full object-cover" />
                            </div>
                          ) : list.length > 0 ? (
                            <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/60 px-2 py-1 text-xs font-medium text-slate-200 ring-1 ring-slate-800">
                              <ImageIcon className="h-3.5 w-3.5" />
                              {list[0]?.symbol?.toUpperCase()} {list[0]?.timeframe}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">—</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
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
              <LabeledBars data={weekGainsPct} barWidth={38} height={96} />
            </section>
          </aside>
        </div>

        {/* Stats des résultats du mois */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Résultats du mois</h2>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-green-900/40 px-3 py-1.5 text-sm font-semibold text-green-300">
                TP1: {resultStats.TP1} <span className="text-green-400/70">({resultStats.total > 0 ? Math.round((resultStats.TP1 / resultStats.total) * 100) : 0}%)</span>
              </span>
              <span className="rounded-lg bg-green-900/60 px-3 py-1.5 text-sm font-semibold text-green-200">
                TP2: {resultStats.TP2} <span className="text-green-300/70">({resultStats.total > 0 ? Math.round((resultStats.TP2 / resultStats.total) * 100) : 0}%)</span>
              </span>
              <span className="rounded-lg bg-emerald-900/60 px-3 py-1.5 text-sm font-semibold text-emerald-200">
                TP3: {resultStats.TP3} <span className="text-emerald-300/70">({resultStats.total > 0 ? Math.round((resultStats.TP3 / resultStats.total) * 100) : 0}%)</span>
              </span>
              <span className="rounded-lg bg-yellow-900/40 px-3 py-1.5 text-sm font-semibold text-yellow-300">
                BE: {resultStats.BE} <span className="text-yellow-400/70">({resultStats.total > 0 ? Math.round((resultStats.BE / resultStats.total) * 100) : 0}%)</span>
                <span className="ml-2 text-[10px] text-yellow-400/60">[TP1: {resultStats.beByPartial.TP1} • TP2: {resultStats.beByPartial.TP2}]</span>
              </span>
              <span className="rounded-lg bg-red-900/40 px-3 py-1.5 text-sm font-semibold text-red-300">
                SL: {resultStats.SL} <span className="text-red-400/70">({resultStats.total > 0 ? Math.round((resultStats.SL / resultStats.total) * 100) : 0}%)</span>
                <span className="ml-2 text-[10px] text-red-400/60">[Full: {resultStats.SL} • TP1: {resultStats.slByPartial.TP1} • TP2: {resultStats.slByPartial.TP2}]</span>
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3 text-sm">
              <span className="text-slate-400">
                {resultStats.wins}/{resultStats.total} trades gagnants
              </span>
              <span className={`rounded-lg px-3 py-1.5 font-bold ${
                resultStats.winRate >= 50 
                  ? "bg-green-900/40 text-green-300" 
                  : "bg-red-900/40 text-red-300"
              }`}>
                Win rate: {resultStats.winRate}%
              </span>
            </div>
          </div>
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

      <DayDrawer
        open={!!selectedDay}
        dayKey={selectedDay ?? ""}
        year={year}
        month={month}
        entries={selectedList}
        onClose={closeDay}
        onAdd={addEntry}
        onUpdate={updateEntry}
      />
    </div>
  )
}

function DayDrawer({
  open,
  dayKey,
  year,
  month,
  entries,
  onClose,
  onAdd,
  onUpdate,
}: {
  open: boolean
  dayKey: string
  year: number
  month: number
  entries: MarkupEntry[]
  onClose: () => void
  onAdd: (entry: MarkupEntry) => void
  onUpdate: (id: string, updater: (e: MarkupEntry) => MarkupEntry) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const defaultTime = "09:15"
  const defaultDatetimeLocal = `${dayKey}T${defaultTime}`

  const [form, setForm] = useState<{
    datetimeLocal: string
    symbol: string
    timeframe: Timeframe
    characteristics: Characteristic[]
    tradeResult: TradeResult | ""
    pips: string
    pipsTP1: string
    resultTP1: PartialResult | ""
    pipsTP2: string
    resultTP2: PartialResult | ""
    pipsTP3: string
    resultTP3: PartialResult | ""
    pipsSL: string
    notes: string
    screenshots: Screenshot[]
  }>({
    datetimeLocal: defaultDatetimeLocal,
    symbol: "MSU",
    timeframe: "M15",
    characteristics: [],
    tradeResult: "",
    pips: "",
    pipsTP1: "",
    resultTP1: "",
    pipsTP2: "",
    resultTP2: "",
    pipsTP3: "",
    resultTP3: "",
    pipsSL: "",
    notes: "",
    screenshots: [],
  })

  // reset si on change de jour
  const lastDay = useRef<string>("")
  useEffect(() => {
    if (!open || !dayKey) return
    if (lastDay.current === dayKey) return
    lastDay.current = dayKey
    setShowForm(false)
    setEditingId(null)
    setIsDragging(false)
    setForm({
      datetimeLocal: defaultDatetimeLocal,
      symbol: "MSU",
      timeframe: "M15",
      characteristics: [],
      tradeResult: "",
      pips: "",
      pipsTP1: "",
      resultTP1: "",
      pipsTP2: "",
      resultTP2: "",
      pipsTP3: "",
      resultTP3: "",
      pipsSL: "",
      notes: "",
      screenshots: [],
    })
  }, [open, dayKey, defaultDatetimeLocal])

  // Ouvrir le formulaire en mode édition
  const startEditing = (entry: MarkupEntry) => {
    setEditingId(entry.id)
    setForm({
      datetimeLocal: entry.datetimeLocal,
      symbol: entry.symbol,
      timeframe: entry.timeframe as Timeframe,
      characteristics: entry.characteristics || [],
      tradeResult: entry.tradeResult || "",
      pips: entry.pips?.toString() || "",
      pipsTP1: entry.pipsTP1?.toString() || "",
      resultTP1: entry.resultTP1 || "",
      pipsTP2: entry.pipsTP2?.toString() || "",
      resultTP2: entry.resultTP2 || "",
      pipsTP3: entry.pipsTP3?.toString() || "",
      resultTP3: entry.resultTP3 || "",
      pipsSL: entry.pipsSL?.toString() || "",
      notes: entry.notes || "",
      screenshots: entry.screenshots || [],
    })
    setShowForm(true)
  }

  // Annuler l'édition
  const cancelEditing = () => {
    setEditingId(null)
    setShowForm(false)
    setForm({
      datetimeLocal: defaultDatetimeLocal,
      symbol: "MSU",
      timeframe: "M15",
      characteristics: [],
      tradeResult: "",
      pips: "",
      pipsTP1: "",
      resultTP1: "",
      pipsTP2: "",
      resultTP2: "",
      pipsTP3: "",
      resultTP3: "",
      pipsSL: "",
      notes: "",
      screenshots: [],
    })
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const addFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"))
    if (images.length === 0) return
    // limite soft pour éviter d'exploser localStorage
    const capped = images.slice(0, 12)
    const dataUrls = await Promise.all(
      capped.map((f) => fileToCompressedDataUrl(f, { maxWidth: 1400, quality: 0.82 })),
    )
    const newShots: Screenshot[] = dataUrls.map((src, i) => ({
      id: `${Date.now()}-${i}-${src.length}`,
      src,
      timeframe: form.timeframe,
    }))
    setForm((p) => ({ ...p, screenshots: [...p.screenshots, ...newShots] }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const symbol = form.symbol.trim().toUpperCase()
    if (!symbol) return

    const pipsNum = form.pips ? parseFloat(form.pips) : undefined
    const pipsTP1Num = form.pipsTP1 ? parseFloat(form.pipsTP1) : undefined
    const pipsTP2Num = form.pipsTP2 ? parseFloat(form.pipsTP2) : undefined
    const pipsTP3Num = form.pipsTP3 ? parseFloat(form.pipsTP3) : undefined
    const pipsSLNum = form.pipsSL ? parseFloat(form.pipsSL) : undefined

    if (editingId) {
      // Mode édition : mettre à jour l'entrée existante
      onUpdate(editingId, (prev) => ({
        ...prev,
        datetimeLocal: form.datetimeLocal,
        symbol,
        timeframe: form.timeframe,
        characteristics: form.characteristics.length ? form.characteristics : undefined,
        tradeResult: form.tradeResult || undefined,
        pips: pipsNum,
        pipsTP1: pipsTP1Num,
        resultTP1: form.resultTP1 || undefined,
        pipsTP2: pipsTP2Num,
        resultTP2: form.resultTP2 || undefined,
        pipsTP3: pipsTP3Num,
        resultTP3: form.resultTP3 || undefined,
        pipsSL: pipsSLNum,
        notes: form.notes.trim() || undefined,
        screenshots: form.screenshots.length ? form.screenshots : undefined,
        screenshotDataUrl: form.screenshots[0]?.src || undefined,
      }))
      setEditingId(null)
    } else {
      // Mode création : ajouter une nouvelle entrée
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())
      onAdd({
        id,
        datetimeLocal: form.datetimeLocal,
        symbol,
        timeframe: form.timeframe,
        strategy: "",
        characteristics: form.characteristics.length ? form.characteristics : undefined,
        tradeResult: form.tradeResult || undefined,
        pips: pipsNum,
        pipsTP1: pipsTP1Num,
        resultTP1: form.resultTP1 || undefined,
        pipsTP2: pipsTP2Num,
        resultTP2: form.resultTP2 || undefined,
        pipsTP3: pipsTP3Num,
        resultTP3: form.resultTP3 || undefined,
        pipsSL: pipsSLNum,
        notes: form.notes.trim() || undefined,
        screenshots: form.screenshots.length ? form.screenshots : undefined,
        screenshotDataUrl: form.screenshots[0]?.src || undefined,
      })
    }
    setShowForm(false)
    setForm({
      datetimeLocal: defaultDatetimeLocal,
      symbol: "MSU",
      timeframe: "M15",
      characteristics: [],
      tradeResult: "",
      pips: "",
      pipsTP1: "",
      resultTP1: "",
      pipsTP2: "",
      resultTP2: "",
      pipsTP3: "",
      resultTP3: "",
      pipsSL: "",
      notes: "",
      screenshots: [],
    })
  }

  if (!open) return null

  const titleDate = (() => {
    const [y, m, d] = dayKey.split("-").map(Number)
    const dt = new Date(y, m - 1, d)
    return `${DAYS_FR[mondayIndex(dt.getDay())]} ${d} ${MONTHS_FR[month - 1]} ${year}`
  })()

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[101] bg-slate-950 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Jour</p>
            <p className="text-xl font-semibold text-slate-100">{titleDate}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-800 p-2.5 text-slate-200 hover:bg-slate-700 transition"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="h-[calc(100%-72px)] overflow-y-auto px-6 py-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-300">{entries.length} entrées</p>
            <button
              type="button"
              onClick={() => {
                if (showForm && !editingId) {
                  setShowForm(false)
                } else {
                  cancelEditing()
                  setShowForm(true)
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          {showForm && (
            <form onSubmit={submit} className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-100">
                  {editingId ? "Modifier l'entrée" : "Nouvelle entrée"}
                </h3>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="text-sm text-slate-400 hover:text-slate-200"
                  >
                    Annuler
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-200">
                  Date & heure
                  <input
                    type="datetime-local"
                    value={form.datetimeLocal}
                    onChange={(e) => setForm((p) => ({ ...p, datetimeLocal: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                  />
                </label>

                <label className="text-sm font-medium text-slate-200">
                  Symbole
                  <select
                    value={form.symbol}
                    onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="MSU">MSU</option>
                  </select>
                </label>

                <div className="text-sm font-medium text-slate-200">
                  Caractéristique
                  <div className="mt-2 space-y-2">
                    {ALLOWED_CHARACTERISTICS.map((char) => (
                      <label key={char} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.characteristics.includes(char)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm((p) => ({ ...p, characteristics: [...p.characteristics, char] }))
                            } else {
                              setForm((p) => ({ ...p, characteristics: p.characteristics.filter((c) => c !== char) }))
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-slate-300 font-normal">{CHARACTERISTIC_LABELS[char]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="text-sm font-medium text-slate-200">
                  Unité de temps
                  <select
                    value={form.timeframe}
                    onChange={(e) => setForm((p) => ({ ...p, timeframe: e.target.value as Timeframe }))}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                  >
                    {TIMEFRAMES.map((tf) => (
                      <option key={tf} value={tf}>
                        {tf}
                      </option>
                    ))}
                  </select>
                </label>

              </div>

              {/* Résultat du trade */}
              <div className="mt-4">
                <span className="text-sm font-medium text-slate-200">Résultat</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ALLOWED_TRADE_RESULTS.map((result) => (
                    <button
                      key={result}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, tradeResult: p.tradeResult === result ? "" : result }))}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        form.tradeResult === result
                          ? TRADE_RESULT_COLORS[result]
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {TRADE_RESULT_LABELS[result]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pips */}
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {/* Total */}
                  <div>
                    <label className="block text-sm font-medium text-slate-200">
                      Total
                      <input
                        type="number"
                        step="0.1"
                        value={form.pips}
                        onChange={(e) => setForm((p) => ({ ...p, pips: e.target.value }))}
                        placeholder="78"
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                  </div>
                  {/* TP1 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-200">
                      TP1
                      <input
                        type="number"
                        step="0.1"
                        value={form.pipsTP1}
                        onChange={(e) => setForm((p) => ({ ...p, pipsTP1: e.target.value }))}
                        placeholder="57"
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <div className="mt-1 flex gap-1">
                      {ALLOWED_PARTIAL_RESULTS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, resultTP1: p.resultTP1 === r ? "" : r }))}
                          className={`flex-1 rounded px-1 py-0.5 text-[10px] font-medium transition ${
                            form.resultTP1 === r ? PARTIAL_RESULT_COLORS[r] : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* TP2 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-200">
                      TP2
                      <input
                        type="number"
                        step="0.1"
                        value={form.pipsTP2}
                        onChange={(e) => setForm((p) => ({ ...p, pipsTP2: e.target.value }))}
                        placeholder="28"
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <div className="mt-1 flex gap-1">
                      {ALLOWED_PARTIAL_RESULTS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, resultTP2: p.resultTP2 === r ? "" : r }))}
                          className={`flex-1 rounded px-1 py-0.5 text-[10px] font-medium transition ${
                            form.resultTP2 === r ? PARTIAL_RESULT_COLORS[r] : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* TP3 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-200">
                      TP3
                      <input
                        type="number"
                        step="0.1"
                        value={form.pipsTP3}
                        onChange={(e) => setForm((p) => ({ ...p, pipsTP3: e.target.value }))}
                        placeholder="15"
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <div className="mt-1 flex gap-1">
                      {ALLOWED_PARTIAL_RESULTS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, resultTP3: p.resultTP3 === r ? "" : r }))}
                          className={`flex-1 rounded px-1 py-0.5 text-[10px] font-medium transition ${
                            form.resultTP3 === r ? PARTIAL_RESULT_COLORS[r] : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* SL */}
                  <div>
                    <label className="block text-sm font-medium text-slate-200">
                      SL
                      <input
                        type="number"
                        step="0.1"
                        value={form.pipsSL}
                        onChange={(e) => setForm((p) => ({ ...p, pipsSL: e.target.value }))}
                        placeholder="25"
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <label className="mt-3 block text-sm font-medium text-slate-200">
                Notes
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={4}
                  placeholder="Explication, contexte, pourquoi, plan..."
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                />
              </label>

              <div className="mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  multiple
                  onChange={(e) => {
                    const list = Array.from(e.target.files ?? [])
                    if (list.length) void addFiles(list)
                    e.currentTarget.value = ""
                  }}
                />
                <div
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(true)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(false)
                    const files = Array.from(e.dataTransfer.files ?? [])
                    if (files.length) void addFiles(files)
                  }}
                  className={[
                    "rounded-2xl border border-dashed p-4 transition",
                    isDragging ? "border-slate-300 bg-slate-950/60" : "border-slate-800 bg-slate-950/30",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-slate-300">Glisse tes captures ici</div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-50"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Parcourir
                    </button>
                  </div>

                  {form.screenshots.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {form.screenshots.map((shot, idx) => (
                        <div
                          key={shot.id}
                          className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={shot.src} alt={`capture ${idx + 1}`} className="h-20 w-full object-cover" />

                          {/* Timeframe tag */}
                          <div className="absolute left-1 top-1 rounded-md bg-black/60 px-1.5 py-1 text-[11px] font-semibold text-slate-100">
                            <span className="mr-1">⏱</span>
                            <select
                              value={shot.timeframe}
                              onChange={(e) => {
                                const tf = e.target.value as Timeframe
                                setForm((p) => ({
                                  ...p,
                                  screenshots: p.screenshots.map((s) => (s.id === shot.id ? { ...s, timeframe: tf } : s)),
                                }))
                              }}
                              className="bg-transparent outline-none appearance-none pr-1"
                            >
                              {TIMEFRAMES.map((tf) => (
                                <option key={tf} value={tf}>
                                  {tf}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setForm((p) => ({
                                ...p,
                                screenshots: p.screenshots.filter((s) => s.id !== shot.id),
                              }))
                            }
                            className="absolute right-1 top-1 rounded-full bg-red-500/90 p-1 text-white hover:bg-red-500"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-end">
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-slate-50"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-6 text-center">
                <p className="text-sm font-medium text-slate-100">Aucune entrée</p>
                <p className="mt-1 text-sm text-slate-300">Ajoute ton premier markup sur ce jour.</p>
              </div>
            ) : (
              entries.map((e) => (
                <div key={e.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {e.symbol.toUpperCase()} <span className="text-slate-400">{e.timeframe}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        {e.datetimeLocal.replace("T", " ")}
                      </p>
                      {e.characteristics && e.characteristics.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {e.characteristics.map((char) => (
                            <span
                              key={char}
                              className="rounded-full bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-300 ring-1 ring-blue-800/50"
                            >
                              {CHARACTERISTIC_LABELS[char]}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Résultat et Pips */}
                      {(e.tradeResult || e.pips !== undefined) && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {e.tradeResult && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${TRADE_RESULT_COLORS[e.tradeResult]}`}>
                              {TRADE_RESULT_LABELS[e.tradeResult]}
                            </span>
                          )}
                          {e.pips !== undefined && (
                            <span className="text-sm font-bold text-slate-100">
                              {e.pips} pips
                            </span>
                          )}
                        </div>
                      )}
                      {/* Détail des partiels */}
                      {(e.pipsTP1 !== undefined || e.pipsTP2 !== undefined || e.pipsTP3 !== undefined || e.pipsSL !== undefined) && (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          {e.pipsTP1 !== undefined && (
                            <span className="text-slate-400">
                              TP1: {e.pipsTP1}
                              {e.resultTP1 && (
                                <span className={`ml-1 rounded px-1 py-0.5 text-[10px] ${PARTIAL_RESULT_COLORS[e.resultTP1]}`}>
                                  {e.resultTP1}
                                </span>
                              )}
                            </span>
                          )}
                          {e.pipsTP2 !== undefined && (
                            <span className="text-slate-400">
                              TP2: {e.pipsTP2}
                              {e.resultTP2 && (
                                <span className={`ml-1 rounded px-1 py-0.5 text-[10px] ${PARTIAL_RESULT_COLORS[e.resultTP2]}`}>
                                  {e.resultTP2}
                                </span>
                              )}
                            </span>
                          )}
                          {e.pipsTP3 !== undefined && (
                            <span className="text-slate-400">
                              TP3: {e.pipsTP3}
                              {e.resultTP3 && (
                                <span className={`ml-1 rounded px-1 py-0.5 text-[10px] ${PARTIAL_RESULT_COLORS[e.resultTP3]}`}>
                                  {e.resultTP3}
                                </span>
                              )}
                            </span>
                          )}
                          {e.pipsSL !== undefined && (
                            <span className="text-slate-400">SL: {e.pipsSL}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(e)}
                        className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <span className="rounded-full bg-slate-950/60 px-2 py-1 text-xs font-semibold text-slate-200 ring-1 ring-slate-800">
                        {e.symbol.toUpperCase()} {e.timeframe}
                      </span>
                    </div>
                  </div>

                  {(e.screenshots?.length || e.screenshotDataUrl) && (
                    <div className="mt-4 space-y-4">
                      {(e.screenshots?.length ? e.screenshots : [{ id: `${e.id}-legacy`, src: e.screenshotDataUrl!, timeframe: e.timeframe }]).map((shot, idx) => (
                        <div
                          key={shot.id}
                          className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={shot.src} 
                            alt="capture" 
                            className="w-full object-contain cursor-pointer hover:opacity-95 transition"
                            style={{ maxHeight: 'calc(100vh - 250px)' }}
                            onClick={() => window.open(shot.src, '_blank')}
                          />

                          {/* Timeframe tag */}
                          <div className="absolute left-3 top-3 rounded-lg bg-black/70 px-3 py-2 text-sm font-semibold text-slate-100 backdrop-blur-sm">
                            ⏱ {shot.timeframe}
                          </div>

                          {/* Delete photo */}
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              onUpdate(e.id, (prev) => {
                                const list = prev.screenshots?.length
                                  ? prev.screenshots.filter((s) => s.id !== shot.id)
                                  : []
                                const next = { ...prev, screenshots: list.length ? list : undefined }
                                next.screenshotDataUrl = next.screenshots?.[0]?.src
                                return next
                              })
                            }}
                            className="absolute right-3 top-3 rounded-full bg-red-500/90 p-2 text-white hover:bg-red-500 transition"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {e.notes && <p className="mt-3 text-sm text-slate-200 whitespace-pre-wrap">{e.notes}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}


