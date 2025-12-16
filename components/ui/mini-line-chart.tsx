"use client"

type Point = { xLabel: string; value: number }

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function MiniLineChart({
  points,
  height = 160,
}: {
  points: Point[]
  height?: number
}) {
  const width = 560
  const padding = 18

  const values = points.map((p) => p.value)
  const minV = Math.min(...values, 0)
  const maxV = Math.max(...values, 0)
  const span = maxV - minV || 1

  const xStep = (width - padding * 2) / Math.max(1, points.length - 1)

  const toX = (i: number) => padding + i * xStep
  const toY = (v: number) => {
    const t = (v - minV) / span
    return padding + (1 - t) * (height - padding * 2)
  }

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(2)} ${toY(p.value).toFixed(2)}`)
    .join(" ")

  const areaD = `${d} L ${toX(points.length - 1).toFixed(2)} ${(height - padding).toFixed(
    2,
  )} L ${toX(0).toFixed(2)} ${(height - padding).toFixed(2)} Z`

  // Ligne 0%
  const zeroY = toY(0)

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950/30">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full">
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(248,250,252,0.22)" />
            <stop offset="1" stopColor="rgba(248,250,252,0.02)" />
          </linearGradient>
        </defs>

        {/* Grille légère */}
        {Array.from({ length: 4 }).map((_, i) => {
          const y = padding + (i * (height - padding * 2)) / 3
          return <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(148,163,184,0.12)" />
        })}

        {/* Ligne zéro */}
        <line
          x1={padding}
          y1={zeroY}
          x2={width - padding}
          y2={zeroY}
          stroke="rgba(148,163,184,0.25)"
          strokeDasharray="4 4"
        />

        {/* Zone */}
        <path d={areaD} fill="url(#area)" />

        {/* Courbe */}
        <path d={d} fill="none" stroke="rgba(248,250,252,0.9)" strokeWidth="2.2" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={p.xLabel}
            cx={toX(i)}
            cy={toY(p.value)}
            r={3.4}
            fill="rgba(248,250,252,0.95)"
            opacity={clamp(0.5 + i / points.length, 0.5, 1)}
          />
        ))}
      </svg>

      {/* Axe X (années) */}
      <div className="flex justify-between px-4 pb-3 text-[11px] text-slate-400">
        <span>{points[0]?.xLabel}</span>
        <span>{points[Math.floor(points.length / 2)]?.xLabel}</span>
        <span>{points[points.length - 1]?.xLabel}</span>
      </div>
    </div>
  )
}


