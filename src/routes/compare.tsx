import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { GitCompareArrows } from 'lucide-react'
import { z } from 'zod'

import type { Car } from '@/lib/car-schema'
import { carsQueryOptions } from '@/lib/queries'
import { useCompare } from '@/hooks/use-compare'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
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
  const { cars: searchIds } = Route.useSearch()
  const navigate = useNavigate()
  const { ids: storeIds, toggle } = useCompare()
  const { data: allCars } = useSuspenseQuery(carsQueryOptions())

  const byId = new Map(allCars.map((car) => [car.id, car] as const))

  // Deep link wins when it carries valid ids; otherwise fall back to the store.
  const deepLinkCars = searchIds
    .map((id) => byId.get(id))
    .filter((car): car is Car => Boolean(car))

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
                : 'Select two or three EVs from the browse page to line them up side by side.'
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
            <CompareTable cars={cars} onRemove={handleRemove} />
          </div>
        )}
      </div>
    </div>
  )
}
