/**
 * src/components/ChartTooltip.tsx
 * One shared custom Recharts tooltip (dashboard-visual-system.md §9.4), used
 * by every chart instead of each page hand-styling `contentStyle`/`itemStyle`.
 * Each row: an 8px swatch in the series' own colour, the label, then the
 * value right-aligned, tabular-nums.
 */
import { useChartTheme } from '../lib/chartTheme'

interface TooltipPayloadItem {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
  /** The original datum for this row — Recharts always attaches it. */
  payload?: Record<string, unknown>
}

interface ChartTooltipProps {
  active?: boolean
  label?: string | number
  payload?: TooltipPayloadItem[]
  /** Override the value shown per row, e.g. to append a unit. */
  formatValue?: (item: TooltipPayloadItem) => string
  /** Override the header row (defaults to the x-axis label). */
  formatLabel?: (label: string | number | undefined, payload?: TooltipPayloadItem[]) => string
}

export default function ChartTooltip({ active, label, payload, formatValue, formatLabel }: ChartTooltipProps) {
  const chart = useChartTheme()
  if (!active || !payload || payload.length === 0) return null

  const title = formatLabel ? formatLabel(label, payload) : (label !== undefined ? String(label) : '')

  return (
    <div
      style={{
        background: chart.tooltipSurface,
        border: `1px solid ${chart.tooltipBorder}`,
        borderRadius: 8, // --control-radius
        padding: '8px 10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      {title && (
        <div style={{ fontSize: 11, fontWeight: 600, color: chart.axisInk, marginBottom: 4 }}>{title}</div>
      )}
      {payload.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span
            style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              backgroundColor: item.color ?? chart.axisInk,
            }}
          />
          <span style={{ color: chart.tooltipInk, fontWeight: 500, flex: 1 }}>{item.name}</span>
          <span style={{ color: chart.tooltipInk, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginLeft: 12 }}>
            {formatValue ? formatValue(item) : item.value}
          </span>
        </div>
      ))}
    </div>
  )
}
