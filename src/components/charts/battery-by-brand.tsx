import * as React from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import type { Car } from '@/lib/car-schema'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBattery } from '@/lib/format'

const BODY_HEIGHT = 420

const chartConfig = {
  avgBatteryKwh: { label: 'Avg battery', color: 'var(--chart-2)' },
} satisfies ChartConfig

interface BrandRow {
  make: string
  avgBatteryKwh: number
}

export function BatteryByBrand({ cars }: { cars: Car[] }) {
  const data = React.useMemo<BrandRow[]>(() => {
    const acc = new Map<string, { sum: number; count: number }>()
    for (const car of cars) {
      const entry = acc.get(car.make) ?? { sum: 0, count: 0 }
      entry.sum += car.batteryGrossKwh
      entry.count += 1
      acc.set(car.make, entry)
    }
    return Array.from(acc.entries())
      // Most-represented makes first, then keep the top 12.
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 12)
      .map(([make, { sum, count }]) => ({
        make,
        avgBatteryKwh: Math.round((sum / count) * 10) / 10,
      }))
      // Within the top makes, rank by average battery (descending).
      .sort((a, b) => b.avgBatteryKwh - a.avgBatteryKwh)
  }, [cars])

  return (
    <ClientOnly
      fallback={<Skeleton className="h-full w-full" style={{ height: BODY_HEIGHT }} />}
    >
      <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="avgBatteryKwh"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v: number) => `${v}`}
          />
          <YAxis
            type="category"
            dataKey="make"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={92}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', fillOpacity: 0.3 }}
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <span className="font-mono tabular-nums">
                    {formatBattery(Number(value))}
                  </span>
                )}
              />
            }
          />
          <Bar
            dataKey="avgBatteryKwh"
            fill="var(--color-avgBatteryKwh)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ChartContainer>
    </ClientOnly>
  )
}
