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
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useMarkups } from "@/components/markups/useMarkups"
import { ALLOWED_TIMEFRAMES, type MarkupEntry, type Screenshot, type Timeframe } from "@/lib/markups/types"
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
  const [isDragging, setIsDragging] = useState(false)

  const defaultTime = "09:15"
  const defaultDatetimeLocal = `${dayKey}T${defaultTime}`

  const [form, setForm] = useState<{
    datetimeLocal: string
    symbol: string
    timeframe: Timeframe
    notes: string
    screenshots: Screenshot[]
  }>({
    datetimeLocal: defaultDatetimeLocal,
    symbol: "MSU",
    timeframe: "M15",
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
    setIsDragging(false)
    setForm({
      datetimeLocal: defaultDatetimeLocal,
      symbol: "MSU",
      timeframe: "M15",
      notes: "",
      screenshots: [],
    })
  }, [open, dayKey, defaultDatetimeLocal])

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
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())

    onAdd({
      id,
      datetimeLocal: form.datetimeLocal,
      symbol,
      timeframe: form.timeframe,
      // Pas de stratégie ici (base), on garde une string vide pour compat
      strategy: "",
      notes: form.notes.trim() || undefined,
      screenshots: form.screenshots.length ? form.screenshots : undefined,
      // legacy: on garde la première image si besoin
      screenshotDataUrl: form.screenshots[0]?.src || undefined,
    })
    setShowForm(false)
  }

  if (!open) return null

  const titleDate = (() => {
    const [y, m, d] = dayKey.split("-").map(Number)
    const dt = new Date(y, m - 1, d)
    return `${DAYS_FR[mondayIndex(dt.getDay())]} ${d} ${MONTHS_FR[month - 1]} ${year}`
  })()

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[101] h-full w-full max-w-xl bg-slate-950 text-slate-100 shadow-2xl border-l border-slate-800">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Jour</p>
            <p className="text-lg font-semibold text-slate-100">{titleDate}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-900/60 p-2 text-slate-200 hover:bg-slate-900 ring-1 ring-slate-800"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-[calc(100%-64px)] overflow-y-auto px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-300">{entries.length} entrées</p>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          {showForm && (
            <form onSubmit={submit} className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
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
                    <option value="LIT">LIT</option>
                  </select>
                </label>

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
                    </div>
                    <span className="rounded-full bg-slate-950/60 px-2 py-1 text-xs font-semibold text-slate-200 ring-1 ring-slate-800">
                      {e.symbol.toUpperCase()} {e.timeframe}
                    </span>
                  </div>

                  {(e.screenshots?.length || e.screenshotDataUrl) && (
                    <div className="mt-3 space-y-3">
                      {(e.screenshots?.length ? e.screenshots : [{ id: `${e.id}-legacy`, src: e.screenshotDataUrl!, timeframe: e.timeframe }]).map((shot, idx) => (
                        <div
                          key={shot.id}
                          className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/30"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={shot.src} 
                            alt="capture" 
                            className="w-full object-contain max-h-[500px] cursor-pointer hover:opacity-95 transition"
                            onClick={() => window.open(shot.src, '_blank')}
                          />

                          {/* Timeframe tag */}
                          <div className="absolute left-2 top-2 rounded-md bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-slate-100 backdrop-blur-sm">
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
                            className="absolute right-2 top-2 rounded-full bg-red-500/90 p-1.5 text-white hover:bg-red-500"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
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


