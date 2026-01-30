"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useMemo } from "react"
import { AppHeader } from "@/components/layout/AppHeader"
import { YearlyBars } from "@/components/ui/yearly-bars"

export default function TrackRecordPage() {
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
      <AppHeader active="dashboard" />
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
            <h1 className="text-3xl font-bold text-slate-100 sm:text-4xl">Track Record</h1>
            <p className="mt-2 text-slate-400">
              Historique de performance par année
            </p>
          </div>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Gains annuels (%)</h2>
            </div>
            <YearlyBars data={yearlyGainsPct} />
          </section>
        </div>
      </main>
    </div>
  )
}


