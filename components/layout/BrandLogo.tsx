"use client"

import Link from "next/link"
import { brandSerif } from "@/lib/fonts"

export function BrandLogo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-3">
      <div className="leading-none">
        <div
          className={[
            brandSerif.className,
            "text-3xl sm:text-4xl tracking-tight text-slate-100",
            "subpixel-antialiased",
          ].join(" ")}
        >
          <span className="italic font-medium">Carni</span>
          <span className="font-semibold">lek</span>
          <span className="font-semibold">.</span>
        </div>
      </div>
    </Link>
  )
}


