import * as React from 'react'

import type { Car } from '@/lib/car-schema'
import { NeonBadge } from '@/components/shared/neon-badge'
import { formatEfficiency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface LeaderRow {
  id: string
  rank: number
  label: string
  variant: string
  efficiencyWhPerMi: number
  /** 0..1 width fraction relative to the worst (longest) bar in the set. */
  fill: number
}

/**
 * Ranked leaderboard of the 10 most efficient cars (lowest Wh/mi wins).
 * Pure DOM — no Recharts — so it needs no ClientOnly wrapper and is SSR-safe.
 */
export function EfficiencyLeaders({ cars }: { cars: Car[] }) {
  const rows = React.useMemo<LeaderRow[]>(() => {
    const top = [...cars]
      .sort((a, b) => a.efficiencyWhPerMi - b.efficiencyWhPerMi)
      .slice(0, 10)
    // Scale bars against the least-efficient car in the leaderboard so the
    // spread between leaders stays legible.
    const worst = top.reduce((m, c) => Math.max(m, c.efficiencyWhPerMi), 0) || 1
    return top.map((car, i) => ({
      id: car.id,
      rank: i + 1,
      label: `${car.make} ${car.model}`,
      variant: car.variant,
      efficiencyWhPerMi: car.efficiencyWhPerMi,
      fill: car.efficiencyWhPerMi / worst,
    }))
  }, [cars])

  return (
    <ol className="flex h-full flex-col justify-between gap-1">
      {rows.map((row) => (
        <li
          key={row.id}
          className="group relative flex items-center gap-3 rounded-md px-2 py-1.5"
        >
          {/* Inverted efficiency bar: shorter = better, so leaders read short. */}
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 -z-10 rounded-md bg-primary/8"
            style={{ width: `${Math.round(row.fill * 100)}%` }}
          />
          <span
            className={cn(
              'w-6 shrink-0 text-center font-mono text-sm tabular-nums',
              row.rank === 1 ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {row.rank}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{row.label}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.variant}
            </p>
          </div>
          <NeonBadge variant={row.rank === 1 ? 'cyan' : 'muted'}>
            {formatEfficiency(row.efficiencyWhPerMi)}
          </NeonBadge>
        </li>
      ))}
    </ol>
  )
}
