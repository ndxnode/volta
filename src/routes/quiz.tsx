import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { z } from 'zod'

import type { Car } from '@/lib/car-schema'
import { BodyStyle } from '@/lib/car-schema'
import { carsQueryOptions } from '@/lib/queries'
import { MAX_COMPARE_IDS } from '@/lib/compare-config'
import { matchBlurb, rankCars, type QuizPrefs } from '@/lib/ev-quiz'
import {
  quizPrefsFromSearch,
  quizPrefsToSearch,
  runningCostFromSearch,
  runningCostToSearch,
  type RunningCostInputs,
} from '@/lib/quiz-search'
import {
  estimateAnnualEnergyCost,
  formatAnnualCost,
} from '@/lib/running-cost'
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

const quizSearchSchema = z.object({
  // Persist quiz prefs to the URL so a ranked result is shareable +
  // back-button friendly. `.catch(undefined)` keeps a hand-edited / bad URL
  // from throwing (same resilience posture as compareSearchSchema's `.catch`).
  budget: z.coerce.number().positive().optional().catch(undefined),
  minRange: z.coerce.number().positive().optional().catch(undefined),
  body: z.enum(BodyStyle.options).optional().catch(undefined),
  seats: z.coerce.number().positive().optional().catch(undefined),
  // Running-cost inputs (don't affect scoring — only the per-result annual
  // energy-cost estimate). Same resilient posture as the prefs keys.
  milesPerYear: z.coerce.number().positive().optional().catch(undefined),
  pricePerKwh: z.coerce.number().positive().optional().catch(undefined),
})

export const Route = createFileRoute('/quiz')({
  validateSearch: quizSearchSchema,
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
  const search = Route.useSearch()
  const navigate = useNavigate()

  // Prefs live in the URL (shareable + back-button friendly). Derive them via
  // the pure quiz-search bridge so junk in the URL can't poison scoring.
  const prefs = quizPrefsFromSearch(search)
  // Running-cost inputs live alongside the prefs in the URL but are kept in a
  // separate shape (they don't affect scoring). Disjoint keys, so both sets
  // coexist when merged on navigate.
  const costInputs = runningCostFromSearch(search)

  // Displayed input values come straight from the search-derived prefs.
  // Empty string = "no preference set"; ANY = the Select's "no pref" sentinel.
  const maxPrice = prefs.maxPriceUsd !== undefined ? String(prefs.maxPriceUsd) : ''
  const minRange = prefs.minRangeMi !== undefined ? String(prefs.minRangeMi) : ''
  const bodyStyle = prefs.bodyStyle ?? ANY
  const minSeats = prefs.minSeats !== undefined ? String(prefs.minSeats) : ANY
  const milesPerYear =
    costInputs.milesPerYear !== undefined ? String(costInputs.milesPerYear) : ''
  const pricePerKwh =
    costInputs.pricePerKwh !== undefined ? String(costInputs.pricePerKwh) : ''

  // Write the next prefs back to the URL, PRESERVING the current cost inputs so
  // editing a pref doesn't drop the running-cost state. `replace: true` (like
  // compare's handleRemove) so typing doesn't spam the history stack.
  function applyPrefs(nextPrefs: QuizPrefs) {
    void navigate({
      to: '/quiz',
      search: {
        ...quizPrefsToSearch(nextPrefs),
        ...runningCostToSearch(costInputs),
      },
      replace: true,
    })
  }

  // Inverse of applyPrefs: write the next cost inputs back while PRESERVING the
  // current prefs, so the two kinds of state coexist in the URL.
  function applyCostInputs(nextInputs: RunningCostInputs) {
    void navigate({
      to: '/quiz',
      search: {
        ...quizPrefsToSearch(prefs),
        ...runningCostToSearch(nextInputs),
      },
      replace: true,
    })
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
              onChange={(event) =>
                applyPrefs({
                  ...prefs,
                  maxPriceUsd: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
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
              onChange={(event) =>
                applyPrefs({
                  ...prefs,
                  minRangeMi: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-body-style">Body style</Label>
            <Select
              value={bodyStyle}
              onValueChange={(value) =>
                applyPrefs({
                  ...prefs,
                  bodyStyle:
                    value === ANY ? undefined : (value as Car['bodyStyle']),
                })
              }
            >
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
            <Select
              value={minSeats}
              onValueChange={(value) =>
                applyPrefs({
                  ...prefs,
                  minSeats: value === ANY ? undefined : Number(value),
                })
              }
            >
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

          <div className="space-y-2">
            <Label htmlFor="quiz-miles-per-year">Miles / year</Label>
            <Input
              id="quiz-miles-per-year"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="12,000"
              value={milesPerYear}
              onChange={(event) =>
                applyCostInputs({
                  ...costInputs,
                  milesPerYear: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-price-per-kwh">Price / kWh ($)</Label>
            <Input
              id="quiz-price-per-kwh"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              placeholder="0.17"
              value={pricePerKwh}
              onChange={(event) =>
                applyCostInputs({
                  ...costInputs,
                  pricePerKwh: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
            />
          </div>

          {/*
            YOUR TURN (user, ~5-10 lines): wire this button's onClick to reset
            the running-cost inputs to their defaults. Navigate DROPPING the two
            running-cost keys so the inputs fall back to 12k mi / $0.17:
              onClick={() =>
                navigate({
                  to: '/quiz',
                  search: quizPrefsToSearch(prefs), // omit milesPerYear/pricePerKwh
                  replace: true,
                })
              }
            Then remove `disabled`. Left disabled + no-op this cycle to keep the
            build green.
          */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled
            onClick={() => {}}
          >
            Reset cost to defaults
          </Button>

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
                  <div className="text-xs text-muted-foreground">
                    {/* Unset inputs are undefined here; the helper's params
                        default to 12k mi / $0.17, so cost falls back cleanly. */}
                    {formatAnnualCost(
                      estimateAnnualEnergyCost(
                        car,
                        costInputs.milesPerYear,
                        costInputs.pricePerKwh,
                      ),
                    )}
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
