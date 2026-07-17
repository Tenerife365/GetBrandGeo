import { createContext, useContext, useState, ReactNode } from 'react'

export type TimeRange = '7d' | '30d' | '90d' | 'all'

interface TimeFilterCtx {
  timeRange: TimeRange
  setTimeRange: (r: TimeRange) => void
  getStartDate: () => Date | null
}

const Ctx = createContext<TimeFilterCtx>({
  timeRange: '7d',
  setTimeRange: () => {},
  getStartDate: () => null,
})

export function TimeFilterProvider({ children }: { children: ReactNode }) {
  // Default to Last 7 days everywhere — one consistent starting window across
  // every tab (was 30d; per-tab trend charts default to the Weekly view to match).
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')

  const getStartDate = (): Date | null => {
    if (timeRange === 'all') return null
    const d = new Date()
    d.setDate(d.getDate() - (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90))
    return d
  }

  return <Ctx.Provider value={{ timeRange, setTimeRange, getStartDate }}>{children}</Ctx.Provider>
}

export const useTimeFilter = () => useContext(Ctx)
