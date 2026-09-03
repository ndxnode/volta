// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import {
  __resetSavedComparisonsForTests,
  buildSavedComparison,
  parseSavedComparisons,
  useSavedComparisons,
} from './use-saved-comparisons'

const STORAGE_KEY = 'volta:saved-comparisons'

describe('parseSavedComparisons', () => {
  test('keeps valid sets and normalizes their fields', () => {
    const parsed = parseSavedComparisons([
      { id: 'a', name: '  Daily drivers  ', carIds: ['tesla', 'rivian'], createdAt: 5 },
    ])

    expect(parsed).toEqual([
      { id: 'a', name: 'Daily drivers', carIds: ['tesla', 'rivian'], createdAt: 5 },
    ])
  })

  test('drops malformed entries, empty car lists, and duplicate ids', () => {
    const parsed = parseSavedComparisons([
      null,
      'nope',
      { id: '', name: 'no id', carIds: ['x'] },
      { id: 'b', name: 'empty', carIds: [] },
      { id: 'c', name: 'good', carIds: ['x', 42, '', 'y'] },
      { id: 'c', name: 'dupe id', carIds: ['z'] },
    ])

    expect(parsed).toEqual([
      { id: 'c', name: 'good', carIds: ['x', 'y'], createdAt: 0 },
    ])
  })

  test('caps each set at three car ids and defaults a blank name', () => {
    const parsed = parseSavedComparisons([
      { id: 'd', name: '   ', carIds: ['a', 'b', 'c', 'd'], createdAt: 1 },
    ])

    expect(parsed[0]?.carIds).toEqual(['a', 'b', 'c'])
    expect(parsed[0]?.name).toBe('Untitled set')
  })

  test('returns an empty array for non-array input', () => {
    expect(parseSavedComparisons('garbage')).toEqual([])
    expect(parseSavedComparisons(null)).toEqual([])
  })
})

describe('buildSavedComparison', () => {
  test('builds a set with a stable shape from a name + ids', () => {
    const set = buildSavedComparison('Road trip', ['a', 'b'], 1000)

    expect(set).not.toBeNull()
    expect(set?.name).toBe('Road trip')
    expect(set?.carIds).toEqual(['a', 'b'])
    expect(set?.createdAt).toBe(1000)
  })

  test('falls back to a generated name when none is given', () => {
    expect(buildSavedComparison('  ', ['a', 'b'], 1)?.name).toBe('Set of 2')
  })

  test('returns null when no valid car ids remain', () => {
    expect(buildSavedComparison('x', [])).toBeNull()
    // Empty-string ids are dropped, leaving nothing to save.
    expect(buildSavedComparison('x', ['', ''])).toBeNull()
  })
})

describe('useSavedComparisons (localStorage persistence)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    // The store is a module singleton; reset its in-memory state too.
    __resetSavedComparisonsForTests()
  })

  afterEach(() => {
    window.localStorage.clear()
    __resetSavedComparisonsForTests()
  })

  test('saving persists to localStorage and exposes the set newest-first', () => {
    const { result } = renderHook(() => useSavedComparisons())

    act(() => {
      result.current.save('First', ['a', 'b'])
    })
    act(() => {
      result.current.save('Second', ['c', 'd'])
    })

    expect(result.current.count).toBe(2)
    // Newest-first ordering.
    expect(result.current.sets.map((s) => s.name)).toEqual(['Second', 'First'])

    const persisted = parseSavedComparisons(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]'),
    )
    expect(persisted).toHaveLength(2)
    expect(persisted.map((s) => s.name).sort()).toEqual(['First', 'Second'])
  })

  test('save returns null and stores nothing when there are no car ids', () => {
    const { result } = renderHook(() => useSavedComparisons())

    let returned: ReturnType<typeof result.current.save> = undefined as never
    act(() => {
      returned = result.current.save('Empty', [])
    })

    expect(returned).toBeNull()
    expect(result.current.count).toBe(0)
  })

  test('removing a set updates the store and localStorage', () => {
    const { result } = renderHook(() => useSavedComparisons())

    let savedId = ''
    act(() => {
      savedId = result.current.save('Keep', ['a'])?.id ?? ''
    })
    act(() => {
      result.current.save('Drop', ['b'])
    })
    expect(result.current.count).toBe(2)

    act(() => {
      result.current.remove(savedId)
    })

    expect(result.current.count).toBe(1)
    expect(result.current.sets.map((s) => s.name)).toEqual(['Drop'])
    expect(
      parseSavedComparisons(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')),
    ).toHaveLength(1)
  })
})
