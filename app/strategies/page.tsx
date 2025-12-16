"use client"

import Link from "next/link"
import { AppHeader } from "@/components/layout/AppHeader"

export default function StrategiesPage() {
  return (
    <div className="min-h-screen text-slate-100">
      <AppHeader active="markups" />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Strategies</h1>
        <p className="mt-3 text-slate-300">
          Module à construire (liste de stratégies, règles, checklists, résultats).
        </p>
        <Link href="/" className="mt-8 inline-block text-sm font-medium text-slate-200 hover:text-white">
          ← Retour
        </Link>
      </main>
    </div>
  )
}


