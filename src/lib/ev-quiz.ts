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
 * Generic fallback shown when no SET preference is satisfied (e.g. an empty `{}`
 * prefs object, or a car that misses every criterion the user pinned). Keeps the
 * /quiz result line non-blank instead of rendering an empty string.
 */
const GENERIC_BLURB = 'Top pick for your preferences'

/**
 * A short, human sentence explaining *why* a car matched the prefs, shown under
 * each /quiz result. PURE: builds one clause per SET preference the car actually
 * satisfies, joins them with `' · '`, and falls back to `GENERIC_BLURB` when no
 * clause applies. Mirrors `scoreCar`'s `=== undefined` guards so an empty `{}`
 * never throws, and skips a clause (rather than emitting a negative) whenever the
 * car falls short of a set floor — so it never reports "negative headroom" or
 * dollars "under budget" for a car that's actually over.
 *
 *   - under budget:   car at/under `maxPriceUsd` -> `$X under budget`
 *   - range headroom: car at/above `minRangeMi`  -> `Y mi of range headroom`
 *   - seats:          car at/above `minSeats`     -> `seats Z`
 *   - body match:     car.bodyStyle === pref      -> `<bodyStyle> you wanted`
 *
 * YOUR TURN (user, ~5 lines): add an EFFICIENCY clause to the `clauses` array —
 * push `` `${car.efficiencyWhPerMi} Wh/mi efficient` `` when
 * `car.efficiencyWhPerMi <= EFFICIENT_WH_PER_MI` (add a doc'd module const
 * `EFFICIENT_WH_PER_MI = 280`), so the blurb also rewards frugal cars. Keep it a
 * pure push into the same array — no new param, no DOM — and it composes into the
 * `' · '` join for free.
 */
export function matchBlurb(car: Car, prefs: QuizPrefs): string {
  const clauses: string[] = []

  if (prefs.maxPriceUsd !== undefined && car.priceUsd <= prefs.maxPriceUsd) {
    clauses.push(`$${(prefs.maxPriceUsd - car.priceUsd).toLocaleString('en-US')} under budget`)
  }
  if (prefs.minRangeMi !== undefined && car.rangeMi >= prefs.minRangeMi) {
    clauses.push(`${car.rangeMi - prefs.minRangeMi} mi of range headroom`)
  }
  if (prefs.minSeats !== undefined && car.seats >= prefs.minSeats) {
    clauses.push(`seats ${car.seats}`)
  }
  if (prefs.bodyStyle !== undefined && car.bodyStyle === prefs.bodyStyle) {
    clauses.push(`${car.bodyStyle} you wanted`)
  }

  // YOUR TURN: see the doc-comment above — push an `EFFICIENT_WH_PER_MI`-gated
  // efficiency clause here so frugal cars get called out too.

  return clauses.length > 0 ? clauses.join(' · ') : GENERIC_BLURB
}
