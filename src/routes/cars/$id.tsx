import { Link, createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowLeft, CarFront } from 'lucide-react'

import { carQueryOptions, carsQueryOptions } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/shared/empty-state'
import { CarHero } from '@/components/detail/car-hero'
import { SpecGrid } from '@/components/detail/spec-grid'
import { RelatedCars } from '@/components/detail/related-cars'

export const Route = createFileRoute('/cars/$id')({
  loader: async ({ context, params }) => {
    // Prime the single car and the full list (for related cars) in parallel.
    await Promise.all([
      context.queryClient.ensureQueryData(carQueryOptions(params.id)),
      context.queryClient.ensureQueryData(carsQueryOptions()),
    ])
  },
  component: CarDetail,
  errorComponent: CarDetailError,
})

function CarDetail() {
  const { id } = Route.useParams()
  const { data: car } = useSuspenseQuery(carQueryOptions(id))
  const { data: allCars } = useSuspenseQuery(carsQueryOptions())

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:py-12">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to="/cars" search={{ make: [], body: [], drive: [], q: '', sort: 'name', dir: 'asc' }}>
          <ArrowLeft aria-hidden />
          All cars
        </Link>
      </Button>

      <CarHero car={car} />

      <Separator />

      <SpecGrid car={car} />

      <RelatedCars current={car} all={allCars} />
    </div>
  )
}

function CarDetailError({ error }: { error: Error }) {
  const notFound = error?.message === 'not_found'

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <EmptyState
        icon={CarFront}
        title={notFound ? 'Car not found' : 'Something went wrong'}
        hint={
          notFound
            ? "We couldn't find that car. It may have been removed or the link is incorrect."
            : 'An unexpected error occurred while loading this car. Please try again.'
        }
        action={
          <Button asChild variant="outline">
            <Link to="/cars" search={{ make: [], body: [], drive: [], q: '', sort: 'name', dir: 'asc' }}>
              <ArrowLeft aria-hidden />
              Back to all cars
            </Link>
          </Button>
        }
      />
    </div>
  )
}
