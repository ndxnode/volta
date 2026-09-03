import { BodyStyle, type Car } from '@/lib/car-schema'

/** A single body-style enum value, e.g. `'sedan'` | `'suv'`. */
type BodyStyleName = (typeof BodyStyle.options)[number]

/** One row of the body-style distribution: a style and how many cars use it. */
export interface BodyStyleCount {
  bodyStyle: BodyStyleName
  count: number
}

/**
 * Tally how many cars use each body style.
 *
 * Returns one row per style that has `count > 0` (empty styles are dropped so
 * the chart isn't padded with zero-height bars), sorted by `count` DESC then by
 * `bodyStyle` ASC (alphabetical) as a stable deterministic tiebreak so equal
 * counts never reorder run-to-run.
 *
 * Pure: no DOM / React / chart imports. Builds a fresh array; the input is not
 * mutated.
 */
export function bodyStyleDistribution(
  cars: Pick<Car, 'bodyStyle'>[],
): BodyStyleCount[] {
  const tally = new Map<BodyStyleName, number>()
  for (const car of cars) {
    tally.set(car.bodyStyle, (tally.get(car.bodyStyle) ?? 0) + 1)
  }

  return Array.from(tally.entries())
    .map(([bodyStyle, count]) => ({ bodyStyle, count }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || a.bodyStyle.localeCompare(b.bodyStyle))
}

/**
 * A single body style's percentage share of the fleet.
 *
 * YOUR TURN (user, ~5-10 lines): replace the hardcoded fallback with the real
 * share. Count how many cars match `bodyStyle` (e.g. reuse
 * `bodyStyleDistribution(cars)` and find the row, or a `.filter().length`),
 * divide by `cars.length`, multiply by 100, and `Math.round` it into a
 * whole-percent string like `'42%'`. Guard the empty fleet first:
 * `if (cars.length === 0) return '0%'` so you never divide by zero. Keep it a
 * pure string return so it stays unit-testable. The hardcoded `'—'` below keeps
 * the build green and the chart ships count bars only — wiring this into a
 * tooltip suffix or sub-label is the next step after.
 */
export function bodyStyleShare(
  _cars: Pick<Car, 'bodyStyle'>[],
  _bodyStyle: BodyStyleName,
): string {
  return '—'
}
