import type { Car } from '@/lib/car-schema'
import { formatPrice } from '@/lib/format'

/**
 * Shown in place of the derived fleet sentence when there are no cars to
 * summarise. Exported so callers/tests assert against the const rather than a
 * magic string.
 */
export const EMPTY_FLEET_SUMMARY = 'No cars in the showroom yet'

/**
 * A one-sentence prose snapshot of the fleet for the /stats lead block, e.g.
 * `"24 EVs · median $54,990 · longest range 516 mi"`.
 *
 * Deliberately reports MEDIAN price + LONGEST range (plus the count) so it does
 * NOT duplicate any headline TILE verbatim: the tiles show AVG price and AVG
 * range, whereas this reads as a distinct natural-language fleet summary.
 *
 * Pure: never mutates the input (price array is a mapped copy, sorted in place
 * on that copy), no React/Recharts/DOM. `priceUsd` and `rangeMi` are both
 * non-nullable on the Car schema, so the empty-fleet guard is the only guard
 * needed.
 */
export function fleetSummary(cars: Pick<Car, 'priceUsd' | 'rangeMi'>[]): string {
  if (cars.length === 0) return EMPTY_FLEET_SUMMARY

  const count = cars.length

  // Median price: sort a fresh copy (numeric comparator), never the input.
  const prices = [...cars].map((c) => c.priceUsd).sort((a, b) => a - b)
  const mid = Math.floor(prices.length / 2)
  const median =
    prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid]

  // Longest range mirrors computeHeadlines' reduce.
  const longest = cars.reduce((m, c) => Math.max(m, c.rangeMi), 0)

  return `${count} EVs · median ${formatPrice(median)} · longest range ${longest} mi`
}

/**
 * STUB — returns `'—'`.
 *
 * YOUR TURN: compute the fleet's min->max price SPAN and return it as a string,
 * e.g. `"$31,990–$119,990"`. Take `Math.min(...)`/`Math.max(...)` over each
 * car's `priceUsd`, run both ends through `formatPrice`, and join them with an
 * en dash (`–`). Guard the empty fleet by returning `'—'` first (so
 * `Math.min()/Math.max()` never see an empty spread). Once it's real you can
 * append it as a fourth clause to the `fleetSummary` sentence.
 */
export function priceSpread(_cars: Pick<Car, 'priceUsd'>[]): string {
  return '—'
}
