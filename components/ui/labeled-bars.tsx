"use client"

type BarDatum = {
  label: string
  pct: number
}

export function LabeledBars({
  data,
  height = 96,
  scale = 0.55,
  barWidth = 34,
}: {
  data: BarDatum[]
  height?: number
  scale?: number
  barWidth?: number
}) {
  const max = Math.max(1, ...data.map((d) => d.pct))
  const fillWidth = data.length > 0 && data.length <= 12

  if (fillWidth) {
    return (
      <div className="w-full">
        <div
          className="grid items-end gap-2"
          style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
        >
          {data.map((d) => (
            <div key={d.label} className="flex flex-col items-center gap-1.5">
              <div className="relative w-full" style={{ height }}>
                <div
                  className="absolute bottom-0 left-0 right-0 mx-auto w-[70%] rounded-t-md bg-slate-100 shadow-[0_0_0_1px_rgba(248,250,252,0.18),0_10px_30px_rgba(0,0,0,0.25)]"
                  style={{ height: `${Math.max(4, (d.pct / max) * 100 * scale)}%` }}
                  title={`${d.label} · ${d.pct}%`}
                />
              </div>
              <div className="text-[11px] font-semibold text-slate-400">{d.label}</div>
              <div className="text-[10px] font-medium text-slate-400">{d.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="w-max">
        <div className="flex items-end gap-2">
          {data.map((d) => (
            <div
              key={d.label}
              className="flex flex-none flex-col items-center gap-1.5"
              style={{ width: barWidth }}
            >
              <div className="relative w-full" style={{ height }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-md bg-slate-100 shadow-[0_0_0_1px_rgba(248,250,252,0.18),0_10px_30px_rgba(0,0,0,0.25)]"
                  style={{ height: `${Math.max(4, (d.pct / max) * 100 * scale)}%` }}
                  title={`${d.label} · ${d.pct}%`}
                />
              </div>
              <div className="text-[11px] font-semibold text-slate-400">{d.label}</div>
              <div className="text-[10px] font-medium text-slate-400">{d.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


