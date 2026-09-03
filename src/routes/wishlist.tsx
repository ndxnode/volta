import { createFileRoute, Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { m, useReducedMotion } from 'motion/react'
import { Bookmark, GitCompareArrows, Trash2 } from 'lucide-react'

import type { Car } from '@/lib/car-schema'
import { carsQueryOptions } from '@/lib/queries'
import { useSavedComparisons } from '@/hooks/use-saved-comparisons'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { GlassCard } from '@/components/shared/glass-card'
import { NeonBadge } from '@/components/shared/neon-badge'
import { CarImage } from '@/components/shared/car-image'

const STAGGER_CAP = 12

const savedAtFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export const Route = createFileRoute('/wishlist')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(carsQueryOptions())
  },
  component: WishlistPage,
})

function WishlistPage() {
  const { data: allCars } = useSuspenseQuery(carsQueryOptions())
  // SSR-safe store: getServerSnapshot returns [], so the first client paint may
  // be empty until localStorage hydrates on mount via useSyncExternalStore.
  const { sets, count, remove } = useSavedComparisons()
  const reduceMotion = useReducedMotion()

  const byId = new Map(allCars.map((car) => [car.id, car] as const))

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Wishlist"
        gradient
        subtitle={
          count > 0
            ? `${count} saved comparison${count === 1 ? '' : 's'}, kept on this device.`
            : 'Save a comparison from the compare page to revisit it here anytime.'
        }
      />

      <div className="mt-8">
        {count === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saved comparisons yet"
            hint="Line up two or three EVs on the compare page, name the set, and it lands here for quick access."
            action={
              <Button asChild>
                <Link to={'/compare' as LinkProps['to']}>Go to compare</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((set, index) => {
              // Resolve ids against the current dataset; drop any that vanished.
              const cars = set.carIds
                .map((id) => byId.get(id))
                .filter((car): car is Car => Boolean(car))

              return (
                <m.li
                  key={set.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeOut',
                    delay: reduceMotion ? 0 : Math.min(index, STAGGER_CAP) * 0.04,
                  }}
                >
                  <GlassCard
                    interactive
                    className="flex h-full flex-col gap-4 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <h2 className="truncate font-display text-lg font-medium text-foreground">
                          {set.name}
                        </h2>
                        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                          Saved {savedAtFormat.format(new Date(set.createdAt))}
                        </p>
                      </div>
                      <NeonBadge variant="cyan" className="shrink-0">
                        {cars.length} car{cars.length === 1 ? '' : 's'}
                      </NeonBadge>
                    </div>

                    {cars.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        The cars in this set are no longer available.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {cars.map((car) => (
                          <li key={car.id} className="flex items-center gap-2">
                            <CarImage
                              src={car.imageUrl ?? undefined}
                              alt={`${car.year} ${car.make} ${car.model} ${car.variant}`}
                              accentColor={car.accentColor}
                              className="size-8 shrink-0 rounded-full"
                              sizes="32px"
                            />
                            <span className="truncate text-sm text-foreground">
                              {car.make} {car.model}{' '}
                              <span className="text-muted-foreground">{car.variant}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-auto flex items-center gap-2 pt-1">
                      {/* `disabled` has no effect on an <a>, so a set with fewer
                          than two resolvable cars (compare's minimum) renders a
                          real disabled <button> instead of a clickable link that
                          would dead-end on the "Add cars to compare" state. */}
                      {cars.length < 2 ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled
                          data-icon="inline-start"
                        >
                          <GitCompareArrows aria-hidden />
                          Open compare
                        </Button>
                      ) : (
                        <Button asChild size="sm" data-icon="inline-start">
                          <Link
                            to={'/compare' as LinkProps['to']}
                            search={{ cars: set.carIds } as LinkProps['search']}
                          >
                            <GitCompareArrows aria-hidden />
                            Open compare
                          </Link>
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(set.id)}
                        aria-label={`Delete saved comparison ${set.name}`}
                        data-icon="inline-start"
                        className="ml-auto"
                      >
                        <Trash2 aria-hidden />
                        Delete
                      </Button>
                    </div>
                  </GlassCard>
                </m.li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
