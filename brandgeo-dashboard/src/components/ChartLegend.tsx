/**
 * src/components/ChartLegend.tsx
 * Shared Recharts legend (dashboard-visual-system.md §9.6) — an 8px swatch
 * plus a text-token label per series, horizontal, wrapping. Same swatch as
 * EngineChip, so the same 8px circle means the same thing everywhere.
 */
interface LegendPayloadItem {
  value?: string
  color?: string
}

interface ChartLegendProps {
  payload?: LegendPayloadItem[]
}

export default function ChartLegend({ payload }: ChartLegendProps) {
  if (!payload || payload.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingBottom: 4 }}>
      {payload.map((entry, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <span
            className="inline-block rounded-full flex-shrink-0"
            style={{ width: 8, height: 8, backgroundColor: entry.color }}
          />
          {entry.value}
        </span>
      ))}
    </div>
  )
}
