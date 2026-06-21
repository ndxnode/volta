import type { Car } from '@/lib/car-schema'

/**
 * The fixed ordinal seat-count scale, in ascending order. `seats` is
 * `z.number().int().min(2).max(8)`, so the full schema-valid integer range is
 * `[2, 3, 4, 5, 6, 7, 8]` — DISJOINT + EXHAUSTIVE over 2..8 by construction.
 * The labels ARE the seat number itself.
 *
 * Like `PRICE_BANDS` (and unlike the body-style / drivetrain distributions,
 * which are nominal enums sorted count-DESC), these bands form a CONTINUOUS
 * ordinal scale, so the order is intrinsic and never reordered by count.
 */
const SEAT_VALUES = [2, 3, 4, 5, 6, 7, 8] as const

/** A single ordinal seat-count label, e.g. `'2'` | `'5'` | `'8'`. */
export type SeatBand = `${(typeof SEAT_VALUES)[number]}`

/** One row of the seats distribution: a band and how many cars have that seat count. */
export interface SeatCount {
  band: SeatBand
  count: number
}

/**
 * Bucket cars into the seven FIXED ordinal seat-count bands by `seats`.
 *
 * Like `priceBandDistribution`, the bands are an ordinal scale, so ALL SEVEN
 * are ALWAYS returned, in fixed ascending order, even at `count: 0` (a
 * zero-height bar is correct on a continuous axis — the current dataset
 * populates 2/4/5/7/8, so 3 and 6 ship as genuine zero-height bars). There is
 * NO `.filter(count > 0)` and NO `.sort()` — order is intrinsic to the fixed
 * `SEAT_VALUES` list, so empty input -> SEVEN zero rows (NOT `[]`).
 *
 * Matching is a DIRECT value match via `SEAT_VALUES.indexOf(car.seats)`, so
 * there is no upper-exclusive boundary ladder and no off-by-one. An out-of-range
 * seat count is structurally impossible per the Zod schema (`indexOf` would
 * return -1, which the `index !== -1` guard would skip — a defensive note, not a
 * branch the schema can actually reach).
 *
 * Pure: no DOM / React / chart imports. Builds a fresh array; the input is not
 * mutated (and with no `.sort()`, mutation is structurally impossible).
 */
export function seatsDistribution(cars: Pick<Car, 'seats'>[]): SeatCount[] {
  // Seed a fresh, ordered list of all seven seat bands at count 0.
  const counts: SeatCount[] = SEAT_VALUES.map((n) => ({
    band: String(n) as SeatBand,
    count: 0,
  }))

  for (const car of cars) {
    // Direct value match: the seat count's position in the fixed list. An
    // out-of-range value (impossible per the Zod schema) yields -1 and is skipped.
    const index = SEAT_VALUES.indexOf(car.seats as (typeof SEAT_VALUES)[number])
    if (index !== -1) {
      counts[index].count += 1
    }
  }

  return counts
}

/**
 * A single seat band's whole-percent share of the fleet, e.g. `'38%'`.
 *
 * Reuses the pure `seatsDistribution(cars)` to count cars in `band`, divides by
 * the fleet size and rounds to a whole percent. Guards the empty fleet FIRST
 * (`cars.length === 0` -> `'0%'`) so it never divides by zero. Because all seven
 * bands are always seeded, a band with no cars finds a `count: 0` row (not
 * `undefined`), but `row?.count ?? 0` null-guards defensively either way. Pure:
 * no DOM / React / chart imports — a plain, unit-testable string return.
 */
export function seatsShare(cars: Pick<Car, 'seats'>[], band: SeatBand): string {
  if (cars.length === 0) return '0%'
  const row = seatsDistribution(cars).find((r) => r.band === band)
  const count = row?.count ?? 0
  const pct = Math.round((count / cars.length) * 100)
  return `${pct}%`
}
