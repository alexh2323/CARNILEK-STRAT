"use client"

import Link from "next/link"
import { brandSerif } from "@/lib/fonts"
import { GradientBlur } from "@/components/ui/gradient-blur"

export default function Home() {
  return (
    <div className="relative min-h-screen text-slate-100">
      {/* Background “mode” */}
      <div className="pointer-events-none absolute inset-0">
        <div className="opacity-70">
          <GradientBlur radius={80} opacityDecay={0.03} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/70" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl text-center">
          <div
            className={[
              brandSerif.className,
              "text-6xl sm:text-7xl tracking-tight text-slate-100",
              "subpixel-antialiased",
            ].join(" ")}
          >
            <span className="italic font-medium">Carni</span>
            <span className="font-semibold">lek</span>
            <span className="font-semibold">.</span>
          </div>

          <div className="mt-10 flex flex-col gap-3">
            <HomeButton href="/markups">Markups</HomeButton>
            <HomeButton href="/trackrecord">Track Record</HomeButton>
            <HomeButton href="/strategies">Strategies</HomeButton>
          </div>
        </div>
      </main>
    </div>
  )
}

function HomeButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="w-full rounded-2xl border border-slate-800 bg-slate-900/35 px-6 py-4 text-lg font-semibold text-slate-100 backdrop-blur-md transition hover:border-slate-700 hover:bg-slate-900/55"
    >
      {children}
    </Link>
  )
}
