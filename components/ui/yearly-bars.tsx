"use client"

type YearBar = {
  year: number
  pct: number
}

function format2k(year: number) {
  const yy = String(year).slice(-2)
  return `2k${yy}`
}

export function YearlyBars({ data }: { data: YearBar[] }) {
  const max = Math.max(1, ...data.map((d) => d.pct))
  const scale = 0.55 // compresse toutes les barres (max = 55% de la hauteur du bloc)

  return (
    <div className="w-full overflow-x-auto">
      <div className="w-max">
        <div className="flex items-end gap-2">
          {data.map((d) => (
            <div key={d.year} className="flex w-[34px] flex-none flex-col items-center gap-1.5 sm:w-[38px]">
              {/* Pas de “track”/objectif: uniquement la barre blanche, sur fond transparent */}
              <div className="relative h-24 w-full">
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-md bg-slate-100 shadow-[0_0_0_1px_rgba(248,250,252,0.18),0_10px_30px_rgba(0,0,0,0.25)]"
                  style={{ height: `${Math.max(4, (d.pct / max) * 100 * scale)}%` }}
                  title={`${format2k(d.year)} · ${d.pct}%`}
                />
              </div>
              <div className="text-[11px] font-semibold text-slate-400">{format2k(d.year)}</div>
              <div className="text-[10px] font-medium text-slate-400">{d.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


