import * as React from 'react'
import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { X } from 'lucide-react'

import type { Car } from '@/lib/car-schema'
import {
  formatPrice,
  formatRange,
  formatPower,
  formatBattery,
  formatZeroToSixty,
  formatEfficiency,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CarImage } from '@/components/shared/car-image'
import { NeonBadge } from '@/components/shared/neon-badge'

type Direction = 'higher' | 'lower'

interface SpecRow {
  /** Numeric Car field this row reads. */
  key: keyof Car
  label: string
  /** Which way is "better" for the best-in-row highlight. */
  direction: Direction
  /** Renders the display value for a cell. */
  format: (car: Car) => React.ReactNode
}

// Ordered top-to-bottom as they appear in the table. Name is rendered as the
// column header, not a ranked row, so it is intentionally absent here.
const SPEC_ROWS: SpecRow[] = [
  {
    key: 'priceUsd',
    label: 'Price',
    direction: 'lower',
    format: (car) => formatPrice(car.priceUsd),
  },
  {
    key: 'rangeMi',
    label: 'Range',
    direction: 'higher',
    format: (car) => formatRange(car.rangeMi),
  },
  {
    key: 'zeroToSixtySec',
    label: '0–60 mph',
    direction: 'lower',
    format: (car) => formatZeroToSixty(car.zeroToSixtySec),
  },
  {
    key: 'topSpeedMph',
    label: 'Top speed',
    direction: 'higher',
    format: (car) => `${car.topSpeedMph} mph`,
  },
  {
    key: 'powerHp',
    label: 'Power',
    direction: 'higher',
    format: (car) => formatPower(car.powerHp),
  },
  {
    key: 'torqueLbFt',
    label: 'Torque',
    direction: 'higher',
    format: (car) => `${car.torqueLbFt} lb-ft`,
  },
  {
    key: 'batteryGrossKwh',
    label: 'Battery (gross)',
    direction: 'higher',
    format: (car) => formatBattery(car.batteryGrossKwh),
  },
  {
    key: 'maxDcChargeKw',
    label: 'Max DC charge',
    direction: 'higher',
    format: (car) => `${car.maxDcChargeKw} kW`,
  },
  {
    key: 'efficiencyWhPerMi',
    label: 'Efficiency',
    direction: 'lower',
    format: (car) => formatEfficiency(car.efficiencyWhPerMi),
  },
]

/**
 * Pure helper: returns the indices of the winning car(s) for a spec.
 * Returns an empty set when every selected car ties (a tie is not a winner).
 * Exported for clarity / testability.
 */
export function bestIndexFor(
  key: keyof Car,
  direction: Direction,
  cars: Car[],
): Set<number> {
  const values = cars.map((car) => car[key])

  if (
    cars.length < 2 ||
    !values.every((value): value is number => typeof value === 'number')
  ) {
    return new Set()
  }

  const best =
    direction === 'higher' ? Math.max(...values) : Math.min(...values)

  // All equal → tie → no winner.
  if (values.every((value) => value === best)) {
    return new Set()
  }

  const winners = new Set<number>()
  values.forEach((value, index) => {
    if (value === best) winners.add(index)
  })

  return winners
}

interface CompareTableProps {
  cars: Car[]
  /** Removes a car from the comparison (also clears it from the store). */
  onRemove: (id: string) => void
}

/**
 * Side-by-side comparison: one column per car, one row per spec, with a subtle
 * cyan best-in-row highlight + BEST badge on the winning cell(s).
 *
 * Desktop: a single table. Mobile: stacked per-car cards driven by the same
 * SPEC_ROWS + bestIndexFor logic.
 */
export function CompareTable({ cars, onRemove }: CompareTableProps) {
  // Precompute winners once per render — keyed by spec label.
  const winnersByRow = React.useMemo(() => {
    const map = new Map<string, Set<number>>()
    for (const row of SPEC_ROWS) {
      map.set(row.label, bestIndexFor(row.key, row.direction, cars))
    }
    return map
  }, [cars])

  return (
    <div>
      {/* Desktop / tablet: side-by-side table */}
      <div className="hidden md:block">
        <div className="glass overflow-x-auto rounded-[var(--radius)]">
          <Table className="border-separate border-spacing-0">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 w-40 bg-card/80 align-bottom backdrop-blur">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Spec
                  </span>
                </TableHead>
                {cars.map((car) => (
                  <TableHead
                    key={car.id}
                    className="min-w-[12rem] align-bottom"
                  >
                    <CarColumnHeader car={car} onRemove={onRemove} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {SPEC_ROWS.map((row) => {
                const winners = winnersByRow.get(row.label)
                return (
                  <TableRow key={row.label} className="hover:bg-transparent">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 whitespace-nowrap border-t border-border bg-card/80 p-2 text-left align-middle text-sm font-medium text-muted-foreground backdrop-blur"
                    >
                      {row.label}
                    </th>
                    {cars.map((car, index) => {
                      const isBest = winners?.has(index) ?? false
                      return (
                        <SpecCell
                          key={car.id}
                          as="td"
                          isBest={isBest}
                          accentColor={car.accentColor}
                          value={row.format(car)}
                        />
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile: stacked per-car cards */}
      <div className="grid gap-4 md:hidden">
        {cars.map((car, index) => (
          <div
            key={car.id}
            className="glass overflow-hidden rounded-[var(--radius)]"
          >
            <div className="border-b border-border p-3">
              <CarColumnHeader car={car} onRemove={onRemove} />
            </div>
            <dl className="divide-y divide-border">
              {SPEC_ROWS.map((row) => {
                const isBest = winnersByRow.get(row.label)?.has(index) ?? false
                return (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <dt className="text-sm font-medium text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd
                      className={cn(
                        'flex items-center gap-2 font-mono text-sm tabular-nums',
                        isBest ? 'text-primary text-glow' : 'text-foreground',
                      )}
                    >
                      {isBest ? (
                        <NeonBadge variant="cyan" className="px-1.5">
                          Best
                        </NeonBadge>
                      ) : null}
                      <span>{row.format(car)}</span>
                    </dd>
                  </div>
                )
              })}
            </dl>
          </div>
        ))}
      </div>
    </div>
  )
}

function CarColumnHeader({
  car,
  onRemove,
}: {
  car: Car
  onRemove: (id: string) => void
}) {
  const fullName = `${car.year} ${car.make} ${car.model} ${car.variant}`
  return (
    <div className="space-y-2 py-2">
      <div className="flex items-start justify-between gap-2">
        <Link
          to={'/cars/$carId' as LinkProps['to']}
          params={{ carId: car.id } as LinkProps['params']}
          className="group/link block rounded-md focus-visible:outline-none"
        >
          <span className="block font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {car.year} {car.make}
          </span>
          <span className="block font-display text-sm font-semibold leading-tight text-foreground group-hover/link:text-primary">
            {car.model}{' '}
            <span className="font-normal text-muted-foreground">
              {car.variant}
            </span>
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onRemove(car.id)}
          aria-label={`Remove ${fullName} from comparison`}
          className="-mr-1 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X aria-hidden />
        </Button>
      </div>
      <Link
        to={'/cars/$carId' as LinkProps['to']}
        params={{ carId: car.id } as LinkProps['params']}
        className="block overflow-hidden rounded-md focus-visible:outline-none"
        aria-label={`View ${fullName}`}
      >
        <CarImage
          src={car.imageUrl ?? undefined}
          alt={fullName}
          accentColor={car.accentColor}
          className="aspect-video w-full"
          sizes="(max-width: 1024px) 33vw, 12rem"
        />
      </Link>
    </div>
  )
}

function SpecCell({
  as: As,
  isBest,
  accentColor,
  value,
}: {
  as: 'td'
  isBest: boolean
  accentColor: string
  value: React.ReactNode
}) {
  return (
    <As
      className={cn(
        'relative border-t border-border p-2 align-middle font-mono text-sm tabular-nums transition-colors',
        isBest ? 'text-primary' : 'text-foreground',
      )}
      style={
        isBest
          ? {
              backgroundColor: `color-mix(in oklch, ${accentColor} 8%, transparent)`,
            }
          : undefined
      }
    >
      {isBest ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary shadow-[0_0_8px_var(--neon)]"
        />
      ) : null}
      <span className="flex items-center gap-2">
        <span className={cn(isBest && 'text-glow')}>{value}</span>
        {isBest ? (
          <NeonBadge variant="cyan" className="px-1.5">
            Best
          </NeonBadge>
        ) : null}
      </span>
    </As>
  )
}
