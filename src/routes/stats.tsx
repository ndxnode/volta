import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { m } from 'motion/react'

import type { Car } from '@/lib/car-schema'
import { carsQueryOptions } from '@/lib/queries'
import { formatPrice } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { GlassCard } from '@/components/shared/glass-card'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { ChartCard } from '@/components/charts/chart-card'
import { RangePriceScatter } from '@/components/charts/range-price-scatter'
import { BatteryByBrand } from '@/components/charts/battery-by-brand'
import { EfficiencyLeaders } from '@/components/charts/efficiency-leaders'
import { BodyStyleBar } from '@/components/charts/body-style-bar'

export const Route = createFileRoute('/stats')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(carsQueryOptions())
  },
  component: StatsPage,
})

interface Headline {
  key: string
  label: string
  value: number
  format?: (n: number) => string
  suffix?: string
}

function computeHeadlines(cars: Car[]): Headline[] {
  const count = cars.length
  const safe = count || 1
  const totalRange = cars.reduce((sum, c) => sum + c.rangeMi, 0)
  const totalPrice = cars.reduce((sum, c) => sum + c.priceUsd, 0)
  const longestRange = cars.reduce((m, c) => Math.max(m, c.rangeMi), 0)
  const maxCharge = cars.reduce((m, c) => Math.max(m, c.maxDcChargeKw), 0)

  return [
    { key: 'count', label: 'Cars in showroom', value: count },
    {
      key: 'avgRange',
      label: 'Avg EPA range',
      value: Math.round(totalRange / safe),
      suffix: 'mi',
    },
    { key: 'longestRange', label: 'Longest range', value: longestRange, suffix: 'mi' },
    {
      key: 'avgPrice',
      label: 'Avg price',
      value: Math.round(totalPrice / safe),
      format: formatPrice,
    },
    { key: 'maxCharge', label: 'Max DC charge', value: maxCharge, suffix: 'kW' },
  ]
}

function StatsPage() {
  const { data: cars } = useSuspenseQuery(carsQueryOptions())
  const headlines = React.useMemo(() => computeHeadlines(cars), [cars])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        gradient
        title="Showroom analytics"
        subtitle="The fleet at a glance — range, value, battery and efficiency across every model on the floor."
      />

      {/* Headline stat tiles */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5"
      >
        {headlines.map((tile) => (
          <GlassCard key={tile.key} className="p-4 sm:p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {tile.label}
            </p>
            <p className="mt-2 flex items-baseline gap-1">
              <AnimatedNumber
                value={tile.value}
                format={tile.format}
                className="font-display text-2xl font-semibold sm:text-3xl"
              />
              {tile.suffix ? (
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {tile.suffix}
                </span>
              ) : null}
            </p>
          </GlassCard>
        ))}
      </m.div>

      {/* Range vs price — full width, the marquee chart */}
      <ChartCard
        title="The value frontier"
        subtitle="Price against EPA range, colored by drivetrain. Up and to the left is more range per dollar."
        bodyHeight={320}
      >
        <RangePriceScatter cars={cars} />
      </ChartCard>

      {/* Battery by brand + efficiency leaderboard */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Battery by brand"
          subtitle="Average gross pack size (kWh) for the most-represented makes."
          bodyHeight={420}
        >
          <BatteryByBrand cars={cars} />
        </ChartCard>
        <ChartCard
          title="Efficiency leaders"
          subtitle="The ten most efficient cars — lower Wh/mi is better."
          bodyHeight={420}
        >
          <EfficiencyLeaders cars={cars} />
        </ChartCard>
      </div>

      {/* Body-style distribution — full width, like the scatter */}
      <ChartCard
        title="Body styles on the floor"
        subtitle="How the showroom splits across sedans, SUVs, trucks and the rest."
        bodyHeight={420}
      >
        <BodyStyleBar cars={cars} />
      </ChartCard>
    </div>
  )
}
