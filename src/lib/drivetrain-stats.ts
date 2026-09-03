import { Drivetrain, type Car } from '@/lib/car-schema'

/** A single drivetrain enum value, e.g. `'RWD'` | `'AWD'` | `'FWD'`. */
type DrivetrainName = (typeof Drivetrain.options)[number]

/** One row of the drivetrain distribution: a layout and how many cars use it. */
export interface DrivetrainCount {
  drivetrain: DrivetrainName
  count: number
}

/**
 * Tally how many cars use each drivetrain layout.
 *
 * Returns one row per drivetrain that has `count > 0` (empty layouts are dropped
 * so the chart isn't padded with zero-height bars), sorted by `count` DESC then
 * by `drivetrain` ASC (alphabetical) as a stable deterministic tiebreak so equal
 * counts never reorder run-to-run.
 *
 * Pure: no DOM / React / chart imports. Builds a fresh array; the input is not
 * mutated.
 */
export function drivetrainDistribution(
  cars: Pick<Car, 'drivetrain'>[],
): DrivetrainCount[] {
  const tally = new Map<DrivetrainName, number>()
  for (const car of cars) {
    tally.set(car.drivetrain, (tally.get(car.drivetrain) ?? 0) + 1)
  }

  return Array.from(tally.entries())
    .map(([drivetrain, count]) => ({ drivetrain, count }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || a.drivetrain.localeCompare(b.drivetrain))
}

/**
 * A single drivetrain's percentage share of the fleet.
 *
 * YOUR TURN (user, ~5-10 lines): replace the hardcoded fallback with the real
 * share. Count how many cars match `drivetrain` (e.g. reuse
 * `drivetrainDistribution(cars)` and find the row, or a `.filter().length`),
 * divide by `cars.length`, multiply by 100, and `Math.round` it into a
 * whole-percent string like `'58%'`. Guard the empty fleet first:
 * `if (cars.length === 0) return '0%'` so you never divide by zero. Keep it a
 * pure string return so it stays unit-testable. The hardcoded `'—'` below keeps
 * the build green and the chart ships count bars only — wiring this into a
 * tooltip suffix or sub-label is the next step after.
 */
export function drivetrainShare(
  _cars: Pick<Car, 'drivetrain'>[],
  _drivetrain: DrivetrainName,
): string {
  return '—'
}
