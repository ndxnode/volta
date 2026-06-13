import { createFileRoute, Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowRight, BarChart3, GitCompareArrows } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'

import type { Car } from '@/lib/car-schema'
import { carsQueryOptions } from '@/lib/queries'
import {
  formatEfficiency,
  formatRange,
  formatZeroToSixty,
} from '@/lib/format'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/glass-card'
import { GradientText } from '@/components/shared/gradient-text'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { CarGrid } from '@/components/cars/car-grid'

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(carsQueryOptions())
  },
  component: Home,
})

/**
 * Curated showcase of ~6 cars. Goal: a DIVERSE, impressive lineup rather than a
 * wall of the priciest flagships. Strategy:
 *   1. Score every car for a handful of "standout" dimensions (longest range,
 *      quickest 0-60, best efficiency, halo by power, an attainable value pick).
 *   2. Walk those dimensions in order, picking the best car for each — but skip a
 *      brand once it has already contributed a car, so the row never repeats a make.
 * Deterministic throughout: stable comparators, no randomness.
 */
function featuredCars(cars: Car[]): Car[] {
  if (cars.length === 0) return []

  // Tie-break by id keeps every comparator a stable total order.
  const byId = (a: Car, b: Car) => a.id.localeCompare(b.id)

  const dimensions: Array<(a: Car, b: Car) => number> = [
    (a, b) => b.rangeMi - a.rangeMi || byId(a, b), // longest range
    (a, b) => a.zeroToSixtySec - b.zeroToSixtySec || byId(a, b), // quickest 0-60
    (a, b) => a.efficiencyWhPerMi - b.efficiencyWhPerMi || byId(a, b), // most efficient
    (a, b) => b.powerHp - a.powerHp || byId(a, b), // halo / flagship power
    (a, b) => a.priceUsd - b.priceUsd || byId(a, b), // attainable value pick
    (a, b) => b.maxDcChargeKw - a.maxDcChargeKw || byId(a, b), // fastest charging
  ]

  const picked: Car[] = []
  const seenIds = new Set<string>()
  const seenMakes = new Set<string>()

  for (const compare of dimensions) {
    const winner = [...cars]
      .sort(compare)
      .find((car) => !seenIds.has(car.id) && !seenMakes.has(car.make))

    if (winner) {
      picked.push(winner)
      seenIds.add(winner.id)
      seenMakes.add(winner.make)
    }
  }

  // Top up to 6 from the remaining lineup (range-ranked) if dimensions collided.
  if (picked.length < 6) {
    const remaining = [...cars]
      .sort((a, b) => b.rangeMi - a.rangeMi || byId(a, b))
      .filter((car) => !seenIds.has(car.id))

    for (const car of remaining) {
      if (picked.length >= 6) break
      picked.push(car)
      seenIds.add(car.id)
    }
  }

  return picked.slice(0, 6)
}

interface Stat {
  key: string
  label: string
  value: number
  format: (n: number) => string
}

function headlineStats(cars: Car[]): Stat[] {
  const count = cars.length
  const longestRange = cars.reduce((max, c) => Math.max(max, c.rangeMi), 0)
  const quickest = cars.reduce(
    (min, c) => Math.min(min, c.zeroToSixtySec),
    Number.POSITIVE_INFINITY,
  )
  const bestEfficiency = cars.reduce(
    (min, c) => Math.min(min, c.efficiencyWhPerMi),
    Number.POSITIVE_INFINITY,
  )

  return [
    {
      key: 'count',
      label: 'EVs indexed',
      value: count,
      format: (n) => Math.round(n).toLocaleString(),
    },
    {
      key: 'range',
      label: 'Longest range',
      value: longestRange,
      format: formatRange,
    },
    {
      key: 'zero',
      label: 'Quickest 0–60',
      value: Number.isFinite(quickest) ? quickest : 0,
      format: formatZeroToSixty,
    },
    {
      key: 'efficiency',
      label: 'Best efficiency',
      value: Number.isFinite(bestEfficiency) ? bestEfficiency : 0,
      format: formatEfficiency,
    },
  ]
}

function Home() {
  const { data: cars } = useSuspenseQuery(carsQueryOptions())
  const reduceMotion = useReducedMotion()

  const featured = featuredCars(cars)
  const stats = headlineStats(cars)

  const fade = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' as const, delay },
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden rounded-[var(--radius-xl)] px-6 py-20 sm:px-12 sm:py-28">
        {/* The single allowed glow for this region: an ambient cyan/violet wash. */}
        <div
          aria-hidden
          className="animate-ambient pointer-events-none absolute inset-0 -z-10 opacity-90"
          style={{
            backgroundImage:
              'radial-gradient(60% 60% at 20% 20%, color-mix(in oklch, var(--neon) 22%, transparent), transparent 70%), radial-gradient(55% 55% at 85% 15%, color-mix(in oklch, var(--neon-violet) 28%, transparent), transparent 70%), radial-gradient(70% 70% at 50% 110%, color-mix(in oklch, var(--neon-violet) 16%, transparent), transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[var(--background)]/40"
        />

        <m.div {...fade()} className="max-w-3xl">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.4em] text-primary text-glow">
            VOLTA
          </p>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl">
            <GradientText>The electric-car index</GradientText>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
            Every current EV, measured the same way. Browse the full lineup,
            compare specs side by side, and explore the data behind the
            showroom.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to={'/cars' as LinkProps['to']}>
                Browse the index
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={'/compare' as LinkProps['to']}>
                <GitCompareArrows className="size-4" aria-hidden />
                Compare
              </Link>
            </Button>
          </div>
        </m.div>

        {/* ---------- Headline stats ---------- */}
        <m.dl
          {...fade(0.08)}
          className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <GlassCard key={stat.key} className="p-5">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
                <AnimatedNumber value={stat.value} format={stat.format} />
              </dd>
            </GlassCard>
          ))}
        </m.dl>
      </section>

      {/* ---------- Featured cars ---------- */}
      <section className="mt-20">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Featured cars
            </h2>
            <p className="max-w-xl text-muted-foreground text-pretty">
              A curated cross-section of the lineup — one standout per brand,
              from the longest range to the quickest launch.
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden shrink-0 sm:inline-flex">
            <Link to={'/cars' as LinkProps['to']}>
              View all
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="mt-8">
          <CarGrid cars={featured} />
        </div>
      </section>

      {/* ---------- Closing: link to stats ---------- */}
      <section className="my-20">
        <GlassCard className="flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Explore the data
            </h2>
            <p className="max-w-md text-muted-foreground text-pretty">
              Range versus price, battery sizes by brand, efficiency leaders —
              the whole index, charted.
            </p>
          </div>
          <Button asChild size="lg" variant="outline" className="shrink-0">
            <Link to={'/stats' as LinkProps['to']}>
              <BarChart3 className="size-4" aria-hidden />
              View the stats
            </Link>
          </Button>
        </GlassCard>
      </section>
    </div>
  )
}
