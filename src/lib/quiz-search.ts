import { BodyStyle, type Car } from '@/lib/car-schema'
import type { QuizPrefs } from '@/lib/ev-quiz'

/**
 * URL <-> QuizPrefs bridge for the /quiz route. Pure module: NO DOM / React /
 * TanStack-route imports so it stays trivially unit-testable (mirrors
 * ev-quiz.ts / running-cost.ts purity) and the route can lean on it for both
 * `validateSearch` derivation and building a shareable link.
 *
 * The URL uses SHORT keys (`budget` / `minRange` / `body` / `seats`) while the
 * scoring layer uses the descriptive `QuizPrefs` shape
 * (`maxPriceUsd` / `minRangeMi` / `bodyStyle` / `minSeats`). All keys are
 * optional so a bare `/quiz` is valid; junk values are dropped on the way in so
 * a hand-edited URL can never poison scoring.
 */
export type QuizSearch = {
  budget?: number
  minRange?: number
  body?: Car['bodyStyle']
  seats?: number
}

/** Valid body-style strings, used to drop unknown `body` values from the URL. */
const BODY_STYLES = BodyStyle.options

/** A finite, strictly-positive number is the only thing we let into scoring. */
function isPositiveFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * Map short URL keys onto the `QuizPrefs` scoring shape, DROPPING any key that
 * is undefined / not a finite positive number (and any unknown `body` style) so
 * junk in the URL can't poison scoring. Pure: returns a fresh object, never
 * mutates the argument.
 */
export function quizPrefsFromSearch(search: QuizSearch): QuizPrefs {
  const prefs: QuizPrefs = {}
  if (isPositiveFinite(search.budget)) prefs.maxPriceUsd = search.budget
  if (isPositiveFinite(search.minRange)) prefs.minRangeMi = search.minRange
  if (search.body !== undefined && BODY_STYLES.includes(search.body)) {
    prefs.bodyStyle = search.body
  }
  if (isPositiveFinite(search.seats)) prefs.minSeats = search.seats
  return prefs
}

/**
 * Inverse of `quizPrefsFromSearch`: map `QuizPrefs` back to short URL keys,
 * OMITTING undefined fields so the URL stays minimal (no `?budget=&body=`
 * noise). Pure: returns a fresh object, never mutates the argument.
 * `quizPrefsFromSearch(quizPrefsToSearch(p))` deep-equals a cleaned `p`.
 */
export function quizPrefsToSearch(prefs: QuizPrefs): QuizSearch {
  const search: QuizSearch = {}
  if (isPositiveFinite(prefs.maxPriceUsd)) search.budget = prefs.maxPriceUsd
  if (isPositiveFinite(prefs.minRangeMi)) search.minRange = prefs.minRangeMi
  if (prefs.bodyStyle !== undefined && BODY_STYLES.includes(prefs.bodyStyle)) {
    search.body = prefs.bodyStyle
  }
  if (isPositiveFinite(prefs.minSeats)) search.seats = prefs.minSeats
  return search
}

/**
 * Build a relative, shareable `/quiz?...` URL from the current prefs so a
 * "Copy share link" button can hand the user a link that reopens the quiz with
 * their picks already applied.
 *
 * YOUR TURN (user, ~5-10 lines): replace the hardcoded `'/quiz'` below with the
 * real relative URL. Serialize `quizPrefsToSearch(prefs)` into a query string —
 * e.g. push each defined key onto a `URLSearchParams` (stringify the numbers),
 * then return `query ? `/quiz?${query}` : '/quiz'` so an empty prefs object
 * still yields a clean `/quiz`. Keep it pure (no `window` / `location`) so it
 * stays unit-testable. The no-op stub below keeps the build green until you
 * wire the button.
 */
export function shareableQuizUrl(_prefs: QuizPrefs): string {
  return '/quiz'
}
