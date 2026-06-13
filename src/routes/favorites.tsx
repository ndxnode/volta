import { createFileRoute, Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'

import type { Car } from '@/lib/car-schema'
import { carsQueryOptions } from '@/lib/queries'
import { useFavorites } from '@/hooks/use-favorites'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { CarGrid } from '@/components/cars/car-grid'

export const Route = createFileRoute('/favorites')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(carsQueryOptions())
  },
  component: FavoritesPage,
})

function FavoritesPage() {
  const { data: allCars } = useSuspenseQuery(carsQueryOptions())
  // SSR-safe hook: getServerSnapshot returns [], so the first client paint may be
  // empty until localStorage hydrates via useSyncExternalStore. That resolves on
  // mount without a layout flash, so we render whatever the hook reports.
  const { ids, count } = useFavorites()

  const byId = new Map(allCars.map((car) => [car.id, car] as const))
  // Preserve favorite insertion order; drop any ids no longer in the dataset.
  const favorites = ids
    .map((id) => byId.get(id))
    .filter((car): car is Car => Boolean(car))

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Favorites"
        gradient
        subtitle={
          count > 0
            ? `${count} car${count === 1 ? '' : 's'} you've saved.`
            : 'Cars you save are kept here, on this device.'
        }
      />

      <div className="mt-8">
        {favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            hint="Tap the heart on any car to save it here for quick access later."
            action={
              <Button asChild>
                <Link to={'/cars' as LinkProps['to']}>Browse cars</Link>
              </Button>
            }
          />
        ) : (
          <CarGrid cars={favorites} />
        )}
      </div>
    </div>
  )
}
