"use client"

import Link from "next/link"
import { BrandLogo } from "@/components/layout/BrandLogo"

export function AppHeader({ active }: { active: "dashboard" | "markups" }) {
  return (
    <header className="sticky top-0 z-40 bg-transparent">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo />
        <div />
      </div>
    </header>
  )
}


