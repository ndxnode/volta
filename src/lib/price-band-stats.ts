import type { Car } from '@/lib/car-schema'

/**
 * The fixed ordinal price-band labels, in display order from cheapest to
 * priciest. Unlike the body-style / drivetrain distributions (which are nominal
 * enums sorted count-DESC), these bands form a CONTINUOUS ordinal scale, so the
 * order is intrinsic and never reordered by count.
 */
const PRICE_BANDS = ['<$40k', '$40-60k', '$60-80k', '$80k+'] as const

/** A single ordinal price band, e.g. `'<$40k'` | `'$40-60k'`. */
export type PriceBand = (typeof PRICE_BANDS)[number]

/**
 * The internal band cutoffs in dollars, ascending. Boundaries are
 * upper-EXCLUSIVE / lower-inclusive: a car at EXACTLY a cutoff lands in the
 * HIGHER band. With edges `[40_000, 60_000, 80_000]`:
 *   - `price < 40_000`           -> `'<$40k'`
 *   - `40_000 <= price < 60_000` -> `'$40-60k'`
 *   - `60_000 <= price < 80_000` -> `'$60-80k'`
 *   - `price >= 80_000`          -> `'$80k+'`
 */
const BAND_EDGES = [40_000, 60_000, 80_000] as const

/** One row of the price-band distribution: a band and how many cars fall in it. */
export interface PriceBandCount {
  band: PriceBand
  count: number
}

/**
 * Bucket cars into the four FIXED ordinal price bands by `priceUsd`.
 *
 * Structural divergence from `drivetrainDistribution` / `bodyStyleDistribution`:
 * the bands are an ordinal scale, so ALL FOUR are ALWAYS returned, in fixed
 * order, even at `count: 0` (a zero-height bar is correct on a continuous axis).
 * There is NO `.filter(count > 0)` and NO `.sort()` — order is intrinsic to the
 * fixed band list, so empty input -> four zero rows (NOT `[]`).
 *
 * Boundaries are upper-EXCLUSIVE / lower-inclusive (see `BAND_EDGES`): a car at
 * exactly 40000 / 60000 / 80000 lands in the higher band.
 *
 * Pure: no DOM / React / chart imports. Builds a fresh array; the input is not
 * mutated (and with no `.sort()`, mutation is structurally impossible).
 */
export function priceBandDistribution(
  cars: Pick<Car, 'priceUsd'>[],
): PriceBandCount[] {
  // Seed a fresh, ordered list of all four bands at count 0.
  const counts: PriceBandCount[] = PRICE_BANDS.map((band) => ({ band, count: 0 }))

  for (const car of cars) {
    // Index = how many edges the price is >= to (upper-exclusive boundary),
    // which is exactly the matching band's position in the fixed list.
    let index = 0
    while (index < BAND_EDGES.length && car.priceUsd >= BAND_EDGES[index]) {
      index += 1
    }
    counts[index].count += 1
  }

  return counts
}

/**
 * A single price band's percentage share of the fleet.
 *
 * YOUR TURN (user, ~5-10 lines): replace the hardcoded fallback with the real
 * share. Count how many cars fall in `band` (e.g. reuse
 * `priceBandDistribution(cars)` and find the matching row, or a
 * `.filter().length`), divide by `cars.length`, multiply by 100, and
 * `Math.round` it into a whole-percent string like `'38%'`. Guard the empty
 * fleet first: `if (cars.length === 0) return '0%'` so you never divide by zero.
 * Keep it a pure string return so it stays unit-testable. The hardcoded `'—'`
 * below keeps the build green and the chart ships count bars only — wiring this
 * into a tooltip suffix or sub-label is the next step after.
 */
export function priceBandShare(
  _cars: Pick<Car, 'priceUsd'>[],
  _band: PriceBand,
): string {
  return '—'
}
