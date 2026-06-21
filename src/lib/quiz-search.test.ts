import { describe, expect, test } from 'vitest'

import type { QuizPrefs } from '@/lib/ev-quiz'
import {
  quizPrefsFromSearch,
  quizPrefsToSearch,
  shareableQuizUrl,
  type QuizSearch,
} from '@/lib/quiz-search'

describe('round-trip identity', () => {
  test('a full prefs object survives prefs -> search -> prefs', () => {
    const prefs: QuizPrefs = {
      maxPriceUsd: 55_000,
      minRangeMi: 300,
      bodyStyle: 'suv',
      minSeats: 5,
    }
    expect(quizPrefsFromSearch(quizPrefsToSearch(prefs))).toEqual(prefs)
  })

  test('an empty prefs object round-trips to {}', () => {
    expect(quizPrefsToSearch({})).toEqual({})
    expect(quizPrefsFromSearch({})).toEqual({})
  })
})

describe('quizPrefsFromSearch drops junk', () => {
  test('negative / zero / NaN budget and seats are dropped', () => {
    const search: QuizSearch = {
      budget: -1,
      minRange: Number.NaN,
      seats: 0,
    }
    expect(quizPrefsFromSearch(search)).toEqual({})
  })

  test('an unknown body string is dropped', () => {
    const search = { body: 'spaceship' } as unknown as QuizSearch
    expect(quizPrefsFromSearch(search)).toEqual({})
  })

  test('a known body string is kept', () => {
    expect(quizPrefsFromSearch({ body: 'crossover' })).toEqual({
      bodyStyle: 'crossover',
    })
  })
})

describe('quizPrefsToSearch omits undefined keys', () => {
  test('only defined prefs appear as short URL keys (no empty-string keys)', () => {
    const search = quizPrefsToSearch({ maxPriceUsd: 40_000 })
    expect(search).toEqual({ budget: 40_000 })
    expect(Object.keys(search)).toEqual(['budget'])
  })

  test('non-positive prefs are not emitted to the URL', () => {
    expect(quizPrefsToSearch({ maxPriceUsd: 0, minSeats: -2 })).toEqual({})
  })
})

describe('shareableQuizUrl (YOUR TURN stub)', () => {
  test('returns a non-empty /quiz path', () => {
    const url = shareableQuizUrl({ maxPriceUsd: 50_000 })
    expect(url.startsWith('/quiz')).toBe(true)
  })
})
