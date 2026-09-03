/**
 * Shared compare configuration. Lives in a NON-React module so both the
 * React-only `useCompare()` hook and pure helpers (e.g. ev-quiz, the /compare
 * deep-link cap) can read ONE source of truth without pulling in React.
 */
import type { Car } from '@/lib/car-schema'

/** Maximum number of cars that can be compared / deep-linked at once. */
export const MAX_COMPARE_IDS = 6

/**
 * Resolve a list of deep-link car ids to their cars, in order, against a lookup
 * map. Pure: drops unknown ids, preserves request order, and caps the result at
 * `MAX_COMPARE_IDS` so a long `/compare?cars=a,b,c,...` deep link can never
 * render more than the compare matrix supports (columns *or* CSV columns).
 *
 * Cap-before-resolve would over-trim once unknown ids are dropped, so we resolve
 * first, then slice the valid cars.
 */
export function resolveDeepLinkCars(
  ids: readonly string[],
  byId: ReadonlyMap<string, Car>,
): Car[] {
  const resolved: Car[] = []
  for (const id of ids) {
    const car = byId.get(id)
    if (car) resolved.push(car)
    if (resolved.length >= MAX_COMPARE_IDS) break
  }
  return resolved
}
