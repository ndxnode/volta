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
import { bodyStyleDistribution } from '@/lib/body-style-stats'
import { formatBodyStyle } from '@/lib/format'

const BODY_HEIGHT = 420

const chartConfig = {
  count: { label: 'Cars', color: 'var(--chart-3)' },
} satisfies ChartConfig

export function BodyStyleBar({ cars }: { cars: Car[] }) {
  const data = React.useMemo(() => bodyStyleDistribution(cars), [cars])

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
            dataKey="count"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="bodyStyle"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={92}
            tickFormatter={(v: string) => formatBodyStyle(v)}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', fillOpacity: 0.3 }}
            content={
              <ChartTooltipContent
                labelFormatter={(label) => formatBodyStyle(String(label))}
                formatter={(value) => (
                  <span className="font-mono tabular-nums">{Number(value)} cars</span>
                )}
              />
            }
          />
          <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>
    </ClientOnly>
  )
}
