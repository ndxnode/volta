/**
 * Shared compare configuration. Lives in a NON-React module so both the
 * React-only `useCompare()` hook and pure helpers (e.g. ev-quiz, the /compare
 * deep-link cap) can read ONE source of truth without pulling in React.
 */

/** Maximum number of cars that can be compared / deep-linked at once. */
export const MAX_COMPARE_IDS = 6
