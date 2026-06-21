import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { GitCompareArrows } from 'lucide-react'
import { z } from 'zod'

import type { Car } from '@/lib/car-schema'
import { carsQueryOptions } from '@/lib/queries'
import { resolveDeepLinkCars } from '@/lib/compare-config'
import {
  runningCostFromSearch,
  runningCostToSearch,
  type RunningCostInputs,
} from '@/lib/quiz-search'
import { useCompare } from '@/hooks/use-compare'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { GlassCard } from '@/components/shared/glass-card'
import { CompareTable } from '@/components/compare/compare-table'
import { SaveComparison } from '@/components/compare/save-comparison'

const compareSearchSchema = z.object({
  // Deep-link support: /compare?cars=a,b,c (or repeated ?cars=a&cars=b) renders
  // a shared comparison cold. Normalize both forms to a trimmed string[].
  cars: z
    .preprocess((value) => {
      if (Array.isArray(value)) return value
      if (typeof value === 'string') return value.split(',')
      return []
    }, z.array(z.string().min(1)))
    .catch([]),
  // Running-cost inputs that tune the two cost rows to the user's own driving.
  // Same resilient posture as quizSearchSchema's cost keys (`.catch(undefined)`
  // so a hand-edited / bad URL can't throw). Disjoint from `cars`.
  milesPerYear: z.coerce.number().positive().optional().catch(undefined),
  pricePerKwh: z.coerce.number().positive().optional().catch(undefined),
})

export const Route = createFileRoute('/compare')({
  validateSearch: compareSearchSchema,
  loaderDeps: ({ search }) => ({ cars: search.cars }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(carsQueryOptions())
  },
  component: ComparePage,
})

function ComparePage() {
  const { cars: searchIds, milesPerYear, pricePerKwh } = Route.useSearch()
  const navigate = useNavigate()
  const { ids: storeIds, toggle } = useCompare()
  const { data: allCars } = useSuspenseQuery(carsQueryOptions())

  // Tune the two running-cost rows to the user's own driving. Derive via the
  // pure quiz-search bridge (REUSED, not quiz-specific — it only reads
  // milesPerYear / pricePerKwh). Pass a NARROWED object (not the whole search,
  // which also carries `cars`) so it's structurally a QuizSearch; the keys are
  // disjoint from `cars`, so this is clean.
  const costInputs = runningCostFromSearch({ milesPerYear, pricePerKwh })

  const milesPerYearValue =
    costInputs.milesPerYear !== undefined ? String(costInputs.milesPerYear) : ''
  const pricePerKwhValue =
    costInputs.pricePerKwh !== undefined ? String(costInputs.pricePerKwh) : ''

  const byId = new Map(allCars.map((car) => [car.id, car] as const))

  // Deep link wins when it carries valid ids; otherwise fall back to the store.
  // Cap at MAX_COMPARE_IDS so a long ?cars= link can't render extra columns.
  const deepLinkCars = resolveDeepLinkCars(searchIds, byId)

  const usingDeepLink = deepLinkCars.length > 0

  const cars = usingDeepLink
    ? deepLinkCars
    : storeIds
        .map((id) => byId.get(id))
        .filter((car): car is Car => Boolean(car))

  function handleRemove(id: string) {
    if (usingDeepLink) {
      // Mutate the URL selection; keep the deep link as the source of truth.
      const next = cars.filter((car) => car.id !== id).map((car) => car.id)
      void navigate({
        to: '/compare',
        search: { cars: next },
        replace: true,
      })
      return
    }
    toggle(id)
  }

  // Write the next cost inputs back to the URL, PRESERVING the current `cars`
  // selection so editing an input doesn't drop the comparison. Uses the live
  // `cars` ids (covers both deep-link and store selections). `replace: true`
  // (like handleRemove) so typing doesn't spam the history stack.
  function applyCostInputs(next: RunningCostInputs) {
    void navigate({
      to: '/compare',
      search: {
        cars: cars.map((car) => car.id),
        ...runningCostToSearch(next),
      },
      replace: true,
    })
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Compare"
        gradient
        subtitle="Line up to six EVs side by side. The best value in each spec is highlighted."
      />

      <div className="mt-8">
        {cars.length < 2 ? (
          <EmptyState
            icon={GitCompareArrows}
            title="Add cars to compare"
            hint={
              cars.length === 1
                ? 'Pick at least one more EV from the browse page to see them side by side.'
                : 'Select up to six EVs from the browse page to line them up side by side.'
            }
            action={
              <Button asChild>
                <Link to={'/cars' as LinkProps['to']}>Browse cars</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {/* Saving persists the live store selection (not deep-linked ids). */}
            {!usingDeepLink ? <SaveComparison cars={cars} /> : null}

            {/* Tune the two cost rows to the user's own driving. URL-backed via
                the runningCostFromSearch/toSearch bridge, mirroring /quiz. */}
            <GlassCard className="space-y-3 p-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="compare-miles-per-year">Miles / year</Label>
                  <Input
                    id="compare-miles-per-year"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1000}
                    placeholder="12,000"
                    value={milesPerYearValue}
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
                  <Label htmlFor="compare-price-per-kwh">Price / kWh ($)</Label>
                  <Input
                    id="compare-price-per-kwh"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    placeholder="0.17"
                    value={pricePerKwhValue}
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
                  YOUR TURN (user, ~5-10 lines): wire this button's onClick to
                  reset the cost inputs to their defaults. Navigate DROPPING the
                  two running-cost keys (keep `cars`) so the rows fall back to
                  12k mi / $0.17:
                    onClick={() =>
                      navigate({
                        to: '/compare',
                        search: { cars: cars.map((car) => car.id) },
                        replace: true,
                      })
                    }
                  Then remove `disabled`. Left disabled + no-op this cycle to
                  keep the build green.
                */}
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  onClick={() => {}}
                >
                  Reset cost to defaults
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tune the cost rows to your own driving.
              </p>
            </GlassCard>

            <CompareTable
              cars={cars}
              onRemove={handleRemove}
              costInputs={costInputs}
            />
          </div>
        )}
      </div>
    </div>
  )
}
