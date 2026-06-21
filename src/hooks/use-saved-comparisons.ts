import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'volta:saved-comparisons'
const MAX_CARS_PER_SET = 3
const EMPTY_SETS = Object.freeze([]) as readonly SavedComparison[]

/** A user-named, persisted comparison set of up to {@link MAX_CARS_PER_SET} cars. */
export interface SavedComparison {
  id: string
  name: string
  /** Car ids in the order the user selected them. */
  carIds: string[]
  /** Epoch ms; used to sort newest-first and to label the card. */
  createdAt: number
}

/**
 * Coerce arbitrary parsed JSON into a clean SavedComparison[]. Exported so the
 * persistence logic can be unit-tested without a DOM. Drops anything malformed
 * rather than throwing, mirroring the favorites/compare stores' defensiveness.
 */
export function parseSavedComparisons(input: unknown): SavedComparison[] {
  if (!Array.isArray(input)) return []

  const seenIds = new Set<string>()

  return input.flatMap((entry): SavedComparison[] => {
    if (typeof entry !== 'object' || entry === null) return []

    const { id, name, carIds, createdAt } = entry as Record<string, unknown>

    if (typeof id !== 'string' || !id || seenIds.has(id)) return []
    if (typeof name !== 'string') return []
    if (!Array.isArray(carIds)) return []

    const cleanIds = carIds
      .filter((carId): carId is string => typeof carId === 'string' && carId.length > 0)
      .slice(0, MAX_CARS_PER_SET)

    if (cleanIds.length === 0) return []

    seenIds.add(id)

    return [
      {
        id,
        name: name.trim() || 'Untitled set',
        carIds: cleanIds,
        createdAt: typeof createdAt === 'number' && Number.isFinite(createdAt) ? createdAt : 0,
      },
    ]
  })
}

/**
 * Build a new SavedComparison from a raw name + car-id list. Returns null when
 * there is nothing worth saving (no valid car ids). Pure + side-effect free so
 * it can be tested directly.
 */
export function buildSavedComparison(
  name: string,
  carIds: readonly string[],
  now: number = Date.now(),
): SavedComparison | null {
  const cleanIds = carIds
    .filter((carId): carId is string => typeof carId === 'string' && carId.length > 0)
    .slice(0, MAX_CARS_PER_SET)

  if (cleanIds.length === 0) return null

  const trimmed = name.trim()

  return {
    id: `cmp-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed || `Set of ${cleanIds.length}`,
    carIds: [...cleanIds],
    createdAt: now,
  }
}

const listeners = new Set<() => void>()

let initialized = false
let sets: SavedComparison[] = []
let snapshot: readonly SavedComparison[] = EMPTY_SETS

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readStorage(): SavedComparison[] {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return parseSavedComparisons(raw ? JSON.parse(raw) : [])
  } catch {
    return []
  }
}

function writeStorage() {
  if (!canUseStorage()) return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
  } catch {
    // Ignore unavailable or full storage; the in-memory store still updates.
  }
}

function rebuildSnapshot() {
  // `sets` is held in insertion (chronological) order. Present it newest-first,
  // using insertion order as a stable tiebreaker so saves within the same ms
  // still surface the most-recent one first.
  const ordered = sets
    .map((set, index) => ({ set, index }))
    .sort((a, b) => b.set.createdAt - a.set.createdAt || b.index - a.index)
    .map((entry) => entry.set)

  snapshot = Object.freeze(ordered)
}

function notify() {
  rebuildSnapshot()
  listeners.forEach((listener) => listener())
}

function initialize() {
  if (initialized) return

  initialized = true
  sets = readStorage()
  rebuildSnapshot()
}

function syncFromStorage() {
  sets = readStorage()
  notify()
}

/**
 * Test-only: re-hydrate the in-memory store from localStorage. The store is a
 * module-level singleton (matching the favorites/compare stores), so tests that
 * clear localStorage must also reset this state to stay isolated. Not used by
 * the app.
 */
export function __resetSavedComparisonsForTests() {
  initialized = false
  sets = []
  snapshot = EMPTY_SETS
  initialize()
}

function subscribe(listener: () => void) {
  initialize()
  listeners.add(listener)

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      syncFromStorage()
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}

function getSnapshot() {
  return snapshot
}

function getServerSnapshot() {
  return EMPTY_SETS
}

/**
 * localStorage-backed store of named comparison sets. SSR-safe: the server
 * snapshot is empty and the client hydrates on mount via useSyncExternalStore,
 * exactly like the favorites/compare stores.
 */
export function useSavedComparisons() {
  const saved = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return {
    sets: saved,
    count: saved.length,
    max: MAX_CARS_PER_SET,
    save: (name: string, carIds: readonly string[]): SavedComparison | null => {
      initialize()

      const next = buildSavedComparison(name, carIds)
      if (!next) return null

      sets = [...sets, next]
      writeStorage()
      notify()

      return next
    },
    remove: (id: string) => {
      initialize()

      const next = sets.filter((set) => set.id !== id)
      if (next.length === sets.length) return

      sets = next
      writeStorage()
      notify()
    },
  }
}
