import type { Car } from '@/lib/car-schema'

/**
 * "Find my EV" quiz scoring. Pure module: NO DOM / React / Recharts imports so
 * it stays trivially unit-testable and reusable from the loader.
 *
 * Every preference is optional. An omitted pref contributes a *neutral* score
 * (it does not zero out the whole car), so an empty `{}` still produces a
 * total ordering instead of an all-zero tie.
 */
export type QuizPrefs = {
  maxPriceUsd?: number
  minRangeMi?: number
  bodyStyle?: Car['bodyStyle']
  minSeats?: number
}

/**
 * Per-criterion weights. Each sub-score is normalized to [0,1] first, so the
 * weight is the *maximum* points that criterion can contribute and the total is
 * bounded by the sum of weights. Tuned so range + price (the dimensions buyers
 * weigh hardest) dominate, with bodyStyle and seats as lighter tie-breakers.
 */
const WEIGHTS = {
  price: 1,
  range: 1,
  bodyStyle: 0.6,
  seats: 0.4,
} as const

/**
 * Range span (miles) above the floor at which the range sub-score saturates to
 * ~1. A car exactly at the floor scores ~0; one this many miles past it (or
 * more) scores full credit. Keeps "comfortably above" legible and bounded.
 */
const RANGE_SOFT_SPAN_MI = 150

/**
 * Neutral score handed back for an omitted preference. Mid-scale so present and
 * absent criteria stay on a comparable footing and an empty prefs object ranks
 * cars purely on the criteria the user *did* set (none → stable original order).
 */
const NEUTRAL = 0.5

/** Clamp a value into [0, 1]. */
function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/**
 * Budget fit in [0,1]: 1 when the car is well under budget, tapering toward 0
 * as price approaches the cap. A car *over* budget still scores (clamped to 0),
 * so budget is a soft penalty, not a hard filter.
 */
function priceScore(car: Car, maxPriceUsd: number): number {
  if (maxPriceUsd <= 0) return NEUTRAL
  return clamp01((maxPriceUsd - car.priceUsd) / maxPriceUsd)
}

/**
 * Range fit in [0,1] with a soft floor at `minRangeMi`: at/below the floor the
 * score is ~0, and it ramps to ~1 once the car is `RANGE_SOFT_SPAN_MI` past it.
 */
function rangeScore(car: Car, minRangeMi: number): number {
  return clamp01((car.rangeMi - minRangeMi) / RANGE_SOFT_SPAN_MI)
}

/**
 * Seats fit in [0,1]: full credit once `car.seats >= minSeats`, tapering toward
 * 0 the further the car falls short of the requested seat count.
 */
function seatsScore(car: Car, minSeats: number): number {
  if (minSeats <= 0) return 1
  return clamp01(car.seats / minSeats)
}

/**
 * Score a single car against the prefs. Returns the sum of normalized, weighted
 * sub-scores; omitted prefs contribute `WEIGHTS[x] * NEUTRAL` so they neither
 * reward nor punish. Higher is a better match. Bounded by the sum of WEIGHTS.
 */
export function scoreCar(car: Car, prefs: QuizPrefs): number {
  const price = prefs.maxPriceUsd === undefined ? NEUTRAL : priceScore(car, prefs.maxPriceUsd)
  const range = prefs.minRangeMi === undefined ? NEUTRAL : rangeScore(car, prefs.minRangeMi)
  const body =
    prefs.bodyStyle === undefined ? NEUTRAL : car.bodyStyle === prefs.bodyStyle ? 1 : 0
  const seats = prefs.minSeats === undefined ? NEUTRAL : seatsScore(car, prefs.minSeats)

  return (
    WEIGHTS.price * price +
    WEIGHTS.range * range +
    WEIGHTS.bodyStyle * body +
    WEIGHTS.seats * seats
  )
}

/**
 * Rank cars best-match first. Returns a NEW array (never mutates the input) and
 * is a STABLE sort: ties keep their original relative order. We tag each car
 * with its original index and break score ties by that index so stability holds
 * regardless of the engine's underlying sort.
 */
export function rankCars(cars: Car[], prefs: QuizPrefs): Car[] {
  return cars
    .map((car, index) => ({ car, index, score: scoreCar(car, prefs) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.car)
}

/**
 * A short, human sentence explaining *why* a car matched the prefs, shown under
 * each /quiz result.
 *
 * YOUR TURN (user, ~5-10 lines): replace the single generic fallback below with
 * a per-result, prefs-aware sentence built from `car` + `prefs`. Ideas:
 *   - under budget:   `prefs.maxPriceUsd && car.priceUsd <= prefs.maxPriceUsd`
 *                     -> `$X under your budget`
 *   - range headroom: `prefs.minRangeMi`
 *                     -> `${car.rangeMi - prefs.minRangeMi} mi over your range floor`
 *   - seats:          `prefs.minSeats && car.seats >= prefs.minSeats`
 *                     -> `seats ${car.seats}`
 *   - body match:     `car.bodyStyle === prefs.bodyStyle` -> `${car.bodyStyle} you wanted`
 * Join the parts that apply with `' · '`. Keep it a pure string return so it
 * stays unit-testable; fall back to the generic line when no pref is set. The
 * fallback below keeps the build green until you wire the real copy.
 */
export function matchBlurb(_car: Car, _prefs: QuizPrefs): string {
  return 'Top pick for your preferences'
}
