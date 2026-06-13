import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

import type { Car } from '@/lib/car-schema'
import { formatPrice, formatRange } from '@/lib/format'
import { CarImage } from '@/components/shared/car-image'
import { GlassCard } from '@/components/shared/glass-card'
import { NeonBadge } from '@/components/shared/neon-badge'

// Dataset spans (see car-schema) for normalizing distance across axes.
const PRICE_SPAN = 350_000 - 15_000
const RANGE_SPAN = 600 - 80

/**
 * Scores how "close" a candidate is to the current car: same body style is a
 * strong pull, then nearby price and range. Lower score = closer.
 */
function distance(current: Car, candidate: Car): number {
  const bodyPenalty = candidate.bodyStyle === current.bodyStyle ? 0 : 1
  const pricePart = Math.abs(candidate.priceUsd - current.priceUsd) / PRICE_SPAN
  const rangePart = Math.abs(candidate.rangeMi - current.rangeMi) / RANGE_SPAN
  return bodyPenalty + pricePart + rangePart
}

/**
 * Picks ~4 cars closest to the current one (favouring same body style, then
 * similar price/range) and renders compact, self-contained links. Independent
 * of U5 — renders its own small card.
 */
export function RelatedCars({ current, all }: { current: Car; all: Car[] }) {
  const related = all
    .filter((car) => car.id !== current.id)
    .sort((a, b) => distance(current, a) - distance(current, b))
    .slice(0, 4)

  if (related.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-medium tracking-tight text-foreground">
        Related cars
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((car) => {
          const label = `${car.year} ${car.make} ${car.model} ${car.variant}`
          return (
            <Link
              key={car.id}
              to="/cars/$id"
              params={{ id: car.id }}
              aria-label={`View ${label}`}
              className="group block rounded-[var(--radius)]"
            >
              <GlassCard interactive className="h-full overflow-hidden">
                <div
                  className="relative"
                  style={{
                    backgroundImage: `radial-gradient(120% 110% at 50% 8%, color-mix(in oklch, ${car.accentColor} 26%, transparent) 0%, transparent 62%)`,
                  }}
                >
                  <CarImage
                    src={car.imageUrl ?? undefined}
                    alt={label}
                    accentColor={car.accentColor}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="aspect-[16/10] w-full"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <NeonBadge variant="muted">{car.bodyStyle}</NeonBadge>
                    <ChevronRight
                      aria-hidden
                      className="size-4 text-muted-foreground transition-transform duration-200 [@media(hover:hover)]:group-hover:translate-x-0.5"
                    />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {car.make}
                    </p>
                    <p className="truncate font-display text-sm font-medium text-foreground">
                      {car.model} {car.variant}
                    </p>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs tabular-nums text-muted-foreground">
                    <span>{formatRange(car.rangeMi)}</span>
                    <span className="text-foreground">{formatPrice(car.priceUsd)}</span>
                  </div>
                </div>
              </GlassCard>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
