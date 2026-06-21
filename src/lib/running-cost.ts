import type { Car } from '@/lib/car-schema'

/** Default annual mileage assumption (US average is ~12k mi/yr). */
export const DEFAULT_MILES_PER_YEAR = 12_000

/** Default residential electricity price ($/kWh, ~US average). */
export const DEFAULT_PRICE_PER_KWH = 0.17

/**
 * AC wall-charging efficiency. Energy drawn from the wall is greater than the
 * energy that lands in the pack (onboard-charger + conversion losses, ~10%), so
 * we divide the at-the-battery energy by this to get energy pulled from the wall.
 */
export const WALL_CHARGE_EFFICIENCY = 0.9

/**
 * Estimate annual home-charging energy cost in whole dollars.
 *
 * Wh/mi → kWh/mi (/1000) → kWh/yr at the battery (* miles) → kWh from the wall
 * (/ efficiency) → dollars (* price). Rounded to the nearest whole dollar.
 *
 * Pure: no DOM / React / chart imports.
 */
export function estimateAnnualEnergyCost(
  car: Pick<Car, 'efficiencyWhPerMi'>,
  milesPerYear = DEFAULT_MILES_PER_YEAR,
  pricePerKwh = DEFAULT_PRICE_PER_KWH,
): number {
  const kwhFromWall =
    ((car.efficiencyWhPerMi / 1000) * milesPerYear) / WALL_CHARGE_EFFICIENCY
  return Math.round(kwhFromWall * pricePerKwh)
}

/**
 * Estimate home-charging cost per mile in dollars. NOT rounded — keep cents
 * precision and format at the edge with {@link formatCostPerMile}.
 */
export function estimateCostPerMile(
  car: Pick<Car, 'efficiencyWhPerMi'>,
  pricePerKwh = DEFAULT_PRICE_PER_KWH,
): number {
  return (car.efficiencyWhPerMi / 1000 / WALL_CHARGE_EFFICIENCY) * pricePerKwh
}

/** Format an annual cost as a short approximate label, e.g. `~$420/yr`. */
export function formatAnnualCost(dollars: number): string {
  return `~$${Math.round(dollars)}/yr`
}

/** Format a per-mile cost to 2 decimal places, e.g. `$0.04/mi`. */
export function formatCostPerMile(dollarsPerMile: number): string {
  return `$${dollarsPerMile.toFixed(2)}/mi`
}

/**
 * Running-cost note for a car.
 *
 * YOUR TURN (user, ~5-10 lines): replace the generic fallback with a comparison
 * against a gas-car baseline. Compute the gas equivalent's annual fuel cost at
 * BASELINE_GAS_MPG = 28 and GAS_PRICE_PER_GAL = 3.50
 * (gallons/yr = DEFAULT_MILES_PER_YEAR / 28; $/yr = gallons * 3.50), subtract
 * this car's estimateAnnualEnergyCost(car), and return e.g.
 * `'~$840/yr less than a 28-mpg gas car'`. Keep it a pure string return so it
 * stays unit-testable. The hardcoded fallback below keeps the build green.
 */
export function costComparisonNote(_car: Car): string {
  return 'About what a typical EV costs to run'
}
