import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'

import type { Car } from '@/lib/car-schema'
import { BodyStyle } from '@/lib/car-schema'
import { carsQueryOptions } from '@/lib/queries'
import { MAX_COMPARE_IDS } from '@/lib/compare-config'
import { matchBlurb, rankCars, type QuizPrefs } from '@/lib/ev-quiz'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { GlassCard } from '@/components/shared/glass-card'

export const Route = createFileRoute('/quiz')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(carsQueryOptions())
  },
  component: QuizPage,
})

const BODY_STYLES = BodyStyle.options
const SEAT_OPTIONS = [2, 4, 5, 6, 7] as const
const ANY = 'any'

const priceFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function QuizPage() {
  const { data: allCars } = useSuspenseQuery(carsQueryOptions())

  // Local UI state. Empty string = "no preference set" -> omitted from prefs.
  const [maxPrice, setMaxPrice] = useState('')
  const [minRange, setMinRange] = useState('')
  const [bodyStyle, setBodyStyle] = useState<string>(ANY)
  const [minSeats, setMinSeats] = useState<string>(ANY)

  const prefs: QuizPrefs = {
    maxPriceUsd: maxPrice ? Number(maxPrice) : undefined,
    minRangeMi: minRange ? Number(minRange) : undefined,
    bodyStyle:
      bodyStyle === ANY ? undefined : (bodyStyle as Car['bodyStyle']),
    minSeats: minSeats === ANY ? undefined : Number(minSeats),
  }

  const ranked = rankCars(allCars, prefs)
  // Cap the deep link at the compare max regardless of dataset size.
  const top = ranked.slice(0, MAX_COMPARE_IDS)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Find my EV"
        gradient
        subtitle="Tell us what matters and we'll rank the lineup. Then compare your top matches side by side."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_1fr]">
        {/* Preferences */}
        <GlassCard className="h-fit space-y-5 p-5" glow>
          <div className="space-y-2">
            <Label htmlFor="quiz-max-price">Max price (USD)</Label>
            <Input
              id="quiz-max-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="No limit"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-min-range">Min range (mi)</Label>
            <Input
              id="quiz-min-range"
              type="number"
              inputMode="numeric"
              min={0}
              step={10}
              placeholder="Any range"
              value={minRange}
              onChange={(event) => setMinRange(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-body-style">Body style</Label>
            <Select value={bodyStyle} onValueChange={setBodyStyle}>
              <SelectTrigger id="quiz-body-style" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                {BODY_STYLES.map((style) => (
                  <SelectItem key={style} value={style} className="capitalize">
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-min-seats">Min seats</Label>
            <Select value={minSeats} onValueChange={setMinSeats}>
              <SelectTrigger id="quiz-min-seats" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                {SEAT_OPTIONS.map((seats) => (
                  <SelectItem key={seats} value={String(seats)}>
                    {seats}+
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {top.length > 0 ? (
            <Button asChild className="w-full">
              {/* TanStack Link round-trips through compareSearchSchema; capped <= MAX_COMPARE_IDS. */}
              <Link to="/compare" search={{ cars: top.map((car) => car.id) }}>
                Compare top matches
              </Link>
            </Button>
          ) : null}
        </GlassCard>

        {/* Results */}
        <div className="space-y-3">
          {top.length === 0 ? (
            <GlassCard className="p-6 text-muted-foreground">
              No cars to rank yet.
            </GlassCard>
          ) : (
            top.map((car, index) => (
              <GlassCard
                key={car.id}
                interactive
                className="flex items-center gap-4 p-4"
              >
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 font-display text-sm font-bold text-primary"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-display font-semibold text-foreground">
                      {car.make} {car.model}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {car.variant}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {matchBlurb(car, prefs)}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <div className="text-sm font-medium text-foreground">
                    {priceFmt.format(car.priceUsd)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {car.rangeMi} mi · {car.seats} seats
                  </div>
                </div>
              </GlassCard>
            ))
          )}
          <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" aria-hidden />
            Showing the top {Math.min(top.length, MAX_COMPARE_IDS)} of{' '}
            {allCars.length} ranked by your preferences.
          </p>
        </div>
      </div>
    </div>
  )
}
