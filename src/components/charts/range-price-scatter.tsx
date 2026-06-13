import * as React from 'react'
import { ClientOnly } from '@tanstack/react-router'
import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'

import type { Car } from '@/lib/car-schema'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice, formatRange } from '@/lib/format'

const BODY_HEIGHT = 320

const chartConfig = {
  RWD: { label: 'RWD', color: 'var(--chart-1)' },
  AWD: { label: 'AWD', color: 'var(--chart-2)' },
  FWD: { label: 'FWD', color: 'var(--chart-5)' },
} satisfies ChartConfig

type Drivetrain = keyof typeof chartConfig

interface ScatterPoint {
  priceUsd: number
  rangeMi: number
  label: string
}

export function RangePriceScatter({ cars }: { cars: Car[] }) {
  const byDrivetrain = React.useMemo(() => {
    const groups: Record<Drivetrain, ScatterPoint[]> = {
      RWD: [],
      AWD: [],
      FWD: [],
    }
    for (const car of cars) {
      groups[car.drivetrain].push({
        priceUsd: car.priceUsd,
        rangeMi: car.rangeMi,
        label: `${car.make} ${car.model}`,
      })
    }
    return groups
  }, [cars])

  return (
    <ClientOnly
      fallback={<Skeleton className="h-full w-full" style={{ height: BODY_HEIGHT }} />}
    >
      <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
        <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="priceUsd"
            name="Price"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
          />
          <YAxis
            type="number"
            dataKey="rangeMi"
            name="Range"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={44}
            tickFormatter={(v: number) => `${v}`}
          />
          <ZAxis range={[60, 60]} />
          <ChartTooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(_value, _name, item) => {
                  const point = item.payload as ScatterPoint
                  return (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">
                        {point.label}
                      </span>
                      <span className="font-mono text-muted-foreground tabular-nums">
                        {formatPrice(point.priceUsd)} · {formatRange(point.rangeMi)}
                      </span>
                    </div>
                  )
                }}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {(Object.keys(chartConfig) as Drivetrain[]).map((key) => (
            <Scatter
              key={key}
              name={key}
              data={byDrivetrain[key]}
              fill={`var(--color-${key})`}
              fillOpacity={0.8}
            />
          ))}
        </ScatterChart>
      </ChartContainer>
    </ClientOnly>
  )
}
