import * as React from 'react'
import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { Download, X } from 'lucide-react'

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
import {
  carFullName,
  serializeCompareCsv,
  type CompareCsvRow,
} from '@/lib/compare-csv'
import {
  estimateAnnualEnergyCost,
  estimateCostPerMile,
  formatAnnualCost,
  formatCostPerMile,
} from '@/lib/running-cost'
import type { RunningCostInputs } from '@/lib/quiz-search'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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
  /** Renders the display value for a cell (React node, for the table). */
  format: (car: Car) => React.ReactNode
  /** Plain-string value for CSV export (raw / unformatted-node). */
  csv: (car: Car) => string
}

interface SpecCategory {
  id: string
  label: string
  rows: SpecRow[]
}

/** Renders a possibly-null number as a string, '—' when null. */
function dash(value: number | null): string {
  return value === null ? '—' : String(value)
}

// Four typed groups mapped onto existing Car fields (no schema change). Name is
// rendered as the column header, not a ranked row, so it is intentionally absent.
//
// A FACTORY (not a static const) so the two running-cost rows can read the
// user's own miles/year + $/kWh from /compare's inputs. Everything except the
// two cost rows is independent of `costInputs`; those two thread the inputs
// positionally into the helpers (undefined falls back to the 12k/$0.17 defaults).
function buildSpecCategories(costInputs: RunningCostInputs): SpecCategory[] {
  return [
  {
    id: 'range',
    label: 'Range',
    rows: [
      {
        key: 'rangeMi',
        label: 'Range',
        direction: 'higher',
        format: (car) => formatRange(car.rangeMi),
        csv: (car) => String(car.rangeMi),
      },
      {
        key: 'efficiencyWhPerMi',
        label: 'Efficiency',
        direction: 'lower',
        format: (car) => formatEfficiency(car.efficiencyWhPerMi),
        csv: (car) => String(car.efficiencyWhPerMi),
      },
    ],
  },
  {
    id: 'charging',
    label: 'Charging',
    rows: [
      {
        key: 'batteryGrossKwh',
        label: 'Battery (gross)',
        direction: 'higher',
        format: (car) => formatBattery(car.batteryGrossKwh),
        csv: (car) => String(car.batteryGrossKwh),
      },
      {
        key: 'batteryNetKwh',
        label: 'Battery (net)',
        direction: 'higher',
        format: (car) =>
          car.batteryNetKwh === null ? '—' : formatBattery(car.batteryNetKwh),
        csv: (car) => dash(car.batteryNetKwh),
      },
      {
        key: 'maxDcChargeKw',
        label: 'Max DC charge',
        direction: 'higher',
        format: (car) => `${car.maxDcChargeKw} kW`,
        csv: (car) => String(car.maxDcChargeKw),
      },
      // Derived running-cost lens, co-located with the energy/charging specs.
      // The best-in-row highlight ranks RAW Car fields via bestIndexFor, so this
      // row is keyed on 'efficiencyWhPerMi' (direction 'lower'): scaling by the
      // user's miles/year + $/kWh (or the 12k/$0.17 defaults when unset) is a
      // positive monotonic transform of efficiency, so ranking by efficiency picks
      // the exact same winner(s) as ranking by cost — correct highlight, no change
      // to bestIndexFor. (Sharing the 'efficiencyWhPerMi' key with the 'Efficiency'
      // row is fine: winnersByRow is keyed by the unique row.label, not by key.)
      //
      // IMPLEMENTED: this row now reads `costInputs` (milesPerYear / pricePerKwh)
      // from the /compare inputs row, threaded positionally into the helper —
      // undefined falls back to the helper's 12k mi / $0.17 defaults cleanly.
      {
        key: 'efficiencyWhPerMi',
        label: 'Cost / yr',
        direction: 'lower',
        format: (car) =>
          formatAnnualCost(
            estimateAnnualEnergyCost(
              car,
              costInputs.milesPerYear,
              costInputs.pricePerKwh,
            ),
          ),
        csv: (car) =>
          formatAnnualCost(
            estimateAnnualEnergyCost(
              car,
              costInputs.milesPerYear,
              costInputs.pricePerKwh,
            ),
          ),
      },
      // Per-mile running-cost companion, mirroring the detail page's two cost rows.
      // Also keyed on 'efficiencyWhPerMi' (direction 'lower'): estimateCostPerMile
      // is UNrounded and strictly increasing in efficiency under any fixed $/kWh,
      // so the efficiency winner is exactly the $/mi winner — correct highlight with
      // no change to bestIndexFor. (Three rows now share this key; winnersByRow is a
      // Map keyed by unique row.label, so each computes its own winner set.)
      //
      // IMPLEMENTED: reads `costInputs.pricePerKwh` from the /compare inputs row
      // (undefined falls back to the helper's $0.17 default).
      {
        key: 'efficiencyWhPerMi',
        label: 'Cost / mi',
        direction: 'lower',
        format: (car) =>
          formatCostPerMile(estimateCostPerMile(car, costInputs.pricePerKwh)),
        csv: (car) =>
          formatCostPerMile(estimateCostPerMile(car, costInputs.pricePerKwh)),
      },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    rows: [
      {
        key: 'zeroToSixtySec',
        label: '0–60 mph',
        direction: 'lower',
        format: (car) => formatZeroToSixty(car.zeroToSixtySec),
        csv: (car) => String(car.zeroToSixtySec),
      },
      {
        key: 'topSpeedMph',
        label: 'Top speed',
        direction: 'higher',
        format: (car) => `${car.topSpeedMph} mph`,
        csv: (car) => String(car.topSpeedMph),
      },
      {
        key: 'powerHp',
        label: 'Power',
        direction: 'higher',
        format: (car) => formatPower(car.powerHp),
        csv: (car) => String(car.powerHp),
      },
      {
        key: 'torqueLbFt',
        label: 'Torque',
        direction: 'higher',
        format: (car) => `${car.torqueLbFt} lb-ft`,
        csv: (car) => String(car.torqueLbFt),
      },
    ],
  },
  {
    id: 'dimensions',
    label: 'Dimensions',
    rows: [
      {
        key: 'seats',
        label: 'Seats',
        direction: 'higher',
        format: (car) => String(car.seats),
        csv: (car) => String(car.seats),
      },
      {
        key: 'cargoCuFt',
        label: 'Cargo',
        direction: 'higher',
        format: (car) =>
          car.cargoCuFt === null ? '—' : `${car.cargoCuFt} cu ft`,
        csv: (car) => dash(car.cargoCuFt),
      },
      {
        key: 'priceUsd',
        label: 'Price',
        direction: 'lower',
        format: (car) => formatPrice(car.priceUsd),
        csv: (car) => String(car.priceUsd),
      },
    ],
  },
  ]
}

// Category ids are independent of costInputs (only the two cost ROWS vary), so
// this stays a stable static const — safe for the initial toggle useState.
const ALL_CATEGORY_IDS = ['range', 'charging', 'performance', 'dimensions']

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

// YOUR TURN (user): derive the download filename from the cars in the matrix.
// Right now it always returns a hardcoded name. Build a slugified name from the
// car models + today's date, e.g. `volta-model-3-ioniq-5-2026-06-21.csv`:
//   - map each car's model to lowercase, replace non-alphanumerics with '-'
//   - join a few of them with '-' (cap the length so it stays readable)
//   - append the ISO date (new Date().toISOString().slice(0, 10))
//   - prefix with 'volta-' and suffix with '.csv'
// Keep this pure (no DOM) — only the string-building changes here.
function csvFilename(_cars: Car[]): string {
  return 'volta-compare.csv'
}

/** Triggers a browser download of the given CSV text. DOM glue, kept thin. */
function downloadCsv(filename: string, csv: string) {
  if (typeof document === 'undefined') return

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

interface CompareTableProps {
  cars: Car[]
  /** Removes a car from the comparison (also clears it from the store). */
  onRemove: (id: string) => void
  /**
   * User's miles/year + $/kWh from the /compare inputs row. Threads into the two
   * running-cost rows; defaults to `{}` so the cost helpers fall back to their
   * 12k mi / $0.17 defaults for callers that don't pass it.
   */
  costInputs?: RunningCostInputs
}

/**
 * Side-by-side comparison: one column per car, one row per spec, grouped into
 * toggleable categories, with a subtle cyan best-in-row highlight + BEST badge
 * on the winning cell(s). A "Download CSV" button exports the visible matrix.
 *
 * Desktop: a single table. Mobile: stacked per-car cards driven by the same
 * categories + bestIndexFor logic.
 */
export function CompareTable({
  cars,
  onRemove,
  costInputs = {},
}: CompareTableProps) {
  const [activeCategories, setActiveCategories] =
    React.useState<string[]>(ALL_CATEGORY_IDS)

  // Rebuild the spec categories whenever the cost inputs change so the two
  // running-cost rows reflect the user's own driving.
  const specCategories = React.useMemo(
    () => buildSpecCategories(costInputs),
    [costInputs],
  )

  // Only render categories that are toggled on, preserving canonical order.
  const visibleCategories = React.useMemo(
    () => specCategories.filter((category) => activeCategories.includes(category.id)),
    [specCategories, activeCategories],
  )

  // Precompute winners once per render — keyed by spec label.
  const winnersByRow = React.useMemo(() => {
    const map = new Map<string, Set<number>>()
    for (const category of visibleCategories) {
      for (const row of category.rows) {
        map.set(row.label, bestIndexFor(row.key, row.direction, cars))
      }
    }
    return map
  }, [cars, visibleCategories])

  function handleToggleCategories(next: string[]) {
    // At least one category must stay on.
    if (next.length === 0) return
    setActiveCategories(next)
  }

  function handleDownload() {
    const rows: CompareCsvRow[] = visibleCategories.flatMap((category) =>
      category.rows.map((row) => ({ label: row.label, value: row.csv })),
    )
    const csv = serializeCompareCsv(cars, rows)
    downloadCsv(csvFilename(cars), csv)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          value={activeCategories}
          onValueChange={handleToggleCategories}
          aria-label="Toggle spec categories"
        >
          {specCategories.map((category) => (
            <ToggleGroupItem key={category.id} value={category.id}>
              {category.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="shrink-0"
        >
          <Download aria-hidden />
          Download CSV
        </Button>
      </div>

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
              {visibleCategories.map((category) => (
                <React.Fragment key={category.id}>
                  <TableRow className="hover:bg-transparent">
                    <th
                      scope="colgroup"
                      colSpan={cars.length + 1}
                      className="sticky left-0 z-10 border-t border-border bg-card/60 p-2 text-left align-middle backdrop-blur"
                    >
                      <span className="font-mono text-xs uppercase tracking-wider text-primary">
                        {category.label}
                      </span>
                    </th>
                  </TableRow>
                  {category.rows.map((row) => {
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
                </React.Fragment>
              ))}
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
              {visibleCategories.map((category) => (
                <React.Fragment key={category.id}>
                  <div className="bg-card/40 px-3 py-1.5">
                    <span className="font-mono text-xs uppercase tracking-wider text-primary">
                      {category.label}
                    </span>
                  </div>
                  {category.rows.map((row) => {
                    const isBest =
                      winnersByRow.get(row.label)?.has(index) ?? false
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
                </React.Fragment>
              ))}
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
  const fullName = carFullName(car)
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
