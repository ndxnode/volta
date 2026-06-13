import { SearchX } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'

import { EmptyState } from '@/components/shared/empty-state'
import type { Car } from '@/lib/car-schema'
import { CarCard } from './car-card'

const STAGGER_CAP = 12

/**
 * Responsive car grid (1 → 2 → 3 cols) with a capped stagger-fade entrance.
 * Falls back to an EmptyState when no cars match.
 */
export function CarGrid({ cars }: { cars: Car[] }) {
  const reduceMotion = useReducedMotion()

  if (cars.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No cars match your filters"
        hint="Try widening the price or range, or clearing a filter to see more of the lineup."
      />
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cars.map((car, index) => (
        <m.li
          key={car.id}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
            delay: reduceMotion ? 0 : Math.min(index, STAGGER_CAP) * 0.04,
          }}
        >
          <CarCard car={car} />
        </m.li>
      ))}
    </ul>
  )
}
