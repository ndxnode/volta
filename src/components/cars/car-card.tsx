import { Link } from '@tanstack/react-router'

import { CarImage } from '@/components/shared/car-image'
import { FavoriteButton } from '@/components/shared/favorite-button'
import { GlassCard } from '@/components/shared/glass-card'
import { NeonBadge } from '@/components/shared/neon-badge'
import type { Car } from '@/lib/car-schema'
import { formatPrice, formatRange, formatZeroToSixty } from '@/lib/format'

const DRIVETRAIN_LABELS: Record<Car['drivetrain'], string> = {
  RWD: 'RWD',
  AWD: 'AWD',
  FWD: 'FWD',
}

/**
 * Card for a single car in the browse grid: image, identity, compact specs,
 * and metadata chips. The whole surface links to the detail page; the favorite
 * toggle stops propagation so it never navigates.
 */
export function CarCard({ car }: { car: Car }) {
  const label = `${car.make} ${car.model} ${car.variant}`

  return (
    <GlassCard interactive className="group/card h-full overflow-hidden">
      <Link
        to="/cars/$id"
        params={{ id: car.id }}
        className="flex h-full flex-col rounded-[inherit] outline-none"
        aria-label={`${car.year} ${label}`}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border">
          <CarImage
            src={car.imageUrl ?? undefined}
            alt={`${car.year} ${label}`}
            accentColor={car.accentColor}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="size-full transition-transform duration-500 ease-out [@media(hover:hover)]:group-hover/card:scale-[1.03]"
          />
          <div className="absolute right-2 top-2">
            <FavoriteButton
              carId={car.id}
              carLabel={label}
              size="sm"
              className="bg-card/60 backdrop-blur-sm"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="space-y-0.5">
            <h3 className="font-display text-base font-semibold leading-tight text-foreground">
              {car.make} {car.model}
            </h3>
            <p className="truncate text-sm text-muted-foreground">{car.variant}</p>
          </div>

          <dl className="flex items-baseline justify-between gap-2 font-mono text-sm tabular-nums">
            <div>
              <dt className="sr-only">Price</dt>
              <dd className="font-medium text-foreground">{formatPrice(car.priceUsd)}</dd>
            </div>
            <div className="text-right">
              <dt className="sr-only">Range</dt>
              <dd className="text-muted-foreground">{formatRange(car.rangeMi)}</dd>
            </div>
            <div className="text-right">
              <dt className="sr-only">0–60 mph</dt>
              <dd className="text-muted-foreground">{formatZeroToSixty(car.zeroToSixtySec)}</dd>
            </div>
          </dl>

          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            <NeonBadge variant="cyan">{DRIVETRAIN_LABELS[car.drivetrain]}</NeonBadge>
            <NeonBadge variant="muted">{car.bodyStyle}</NeonBadge>
          </div>
        </div>
      </Link>
    </GlassCard>
  )
}
