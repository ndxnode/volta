import { useQuery } from '@tanstack/react-query'
import { Link, useRouterState } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { AnimatePresence, m } from 'motion/react'
import { GitCompareArrows, X } from 'lucide-react'

import type { Car } from '@/lib/car-schema'
import { carsQueryOptions } from '@/lib/queries'
import { useCompare } from '@/hooks/use-compare'
import { Button } from '@/components/ui/button'
import { CarImage } from '@/components/shared/car-image'

/**
 * Globally mounted (in __root) slide-up glass bar that collects cars the user
 * has flagged to compare. Appears only when count > 0, hides on /compare, and
 * never suspends the app — it reads the car list via a NON-suspense useQuery.
 */
export function CompareTray() {
  const { ids, toggle, clear, count, max } = useCompare()

  // Non-suspense read: while the list is loading on a cold page, data is
  // undefined and we render nothing rather than blocking the whole tree.
  const { data: cars } = useQuery(carsQueryOptions())

  // Hide the tray on the /compare route itself.
  const onComparePage = useRouterState({
    select: (state) => state.location.pathname === '/compare',
  })

  const byId = new Map((cars ?? []).map((car) => [car.id, car] as const))
  const selected = ids
    .map((id) => byId.get(id))
    .filter((car): car is Car => Boolean(car))

  const visible = !onComparePage && count > 0 && selected.length > 0

  return (
    <AnimatePresence>
      {visible ? (
        <m.div
          key="compare-tray"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6 lg:px-8"
        >
          <div
            role="region"
            aria-label="Compare tray"
            className="glass mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 rounded-[var(--radius)] border-primary/25 p-3 shadow-[0_0_24px_-8px_color-mix(in_oklch,var(--neon)_45%,transparent)]"
          >
            <span className="hidden shrink-0 items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground sm:flex">
              <GitCompareArrows className="size-4 text-primary" aria-hidden />
              Compare
            </span>

            {/* Selected chips */}
            <ul className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {selected.map((car) => {
                const fullName = `${car.year} ${car.make} ${car.model} ${car.variant}`
                return (
                  <li key={car.id}>
                    <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 py-1 pl-1 pr-1.5">
                      <CarImage
                        src={car.imageUrl ?? undefined}
                        alt={fullName}
                        accentColor={car.accentColor}
                        className="size-7 rounded-full"
                        sizes="28px"
                      />
                      <span className="max-w-[10rem] truncate text-xs font-medium text-foreground">
                        {car.make} {car.model}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggle(car.id)}
                        aria-label={`Remove ${fullName} from comparison`}
                        className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
              {count < 2 ? (
                <Button
                  size="sm"
                  disabled
                  aria-label="Select at least two cars to compare"
                >
                  Compare ({count})
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to={'/compare' as LinkProps['to']}>
                    Compare ({count}
                    {count >= max ? ` / ${max}` : ''})
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  )
}
