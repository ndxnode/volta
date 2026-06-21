import { useSyncExternalStore } from 'react'

import { MAX_COMPARE_IDS } from '@/lib/compare-config'

const STORAGE_KEY = 'volta:compare'
const EMPTY_IDS = Object.freeze([]) as readonly string[]

const ids = new Set<string>()
const listeners = new Set<() => void>()

let initialized = false
let snapshot = EMPTY_IDS

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function readStorage(): string[] {
  if (!canUseStorage()) return []

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []

    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX_COMPARE_IDS) : []
  } catch {
    return []
  }
}

function writeStorage() {
  if (!canUseStorage()) return

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Ignore unavailable or full storage; the in-memory store still updates.
  }
}

function rebuildSnapshot() {
  snapshot = Object.freeze([...ids])
}

function notify() {
  rebuildSnapshot()
  listeners.forEach((listener) => listener())
}

function initialize() {
  if (initialized) return

  initialized = true
  ids.clear()
  readStorage().forEach((id) => ids.add(id))
  rebuildSnapshot()
}

function subscribe(listener: () => void) {
  initialize()
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return snapshot
}

function getServerSnapshot() {
  return EMPTY_IDS
}

export function useCompare() {
  const compareIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return {
    ids: compareIds,
    has: (id: string) => ids.has(id),
    toggle: (id: string) => {
      initialize()

      if (ids.has(id)) {
        ids.delete(id)
        writeStorage()
        notify()
        return true
      }

      if (ids.size >= MAX_COMPARE_IDS) {
        return false
      }

      ids.add(id)
      writeStorage()
      notify()

      return true
    },
    clear: () => {
      initialize()

      if (!ids.size) return

      ids.clear()
      writeStorage()
      notify()
    },
    count: compareIds.length,
    max: MAX_COMPARE_IDS,
  }
}
