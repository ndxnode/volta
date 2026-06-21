import { describe, expect, test } from 'vitest'

import type { Car } from '@/lib/car-schema'
import { matchBlurb, rankCars, scoreCar, type QuizPrefs } from '@/lib/ev-quiz'

function makeCar(overrides: Partial<Car>): Car {
  return {
    id: 'fixture',
    make: 'Tesla',
    model: 'Model 3',
    variant: 'Long Range AWD',
    year: 2025,
    bodyStyle: 'sedan',
    priceUsd: 47_490,
    rangeMi: 346,
    rangeSource: 'EPA',
    batteryGrossKwh: 78.1,
    batteryNetKwh: 75,
    maxDcChargeKw: 250,
    zeroToSixtySec: 4.2,
    topSpeedMph: 125,
    powerHp: 425,
    powerKw: 317,
    torqueLbFt: 475,
    drivetrain: 'AWD',
    efficiencyWhPerMi: 241,
    seats: 5,
    cargoCuFt: 24.1,
    imageUrl: null,
    imageAttribution: null,
    accentColor: '#e82127',
    ...overrides,
  }
}

describe('scoreCar', () => {
  test('a car matching ALL prefs outranks one matching none', () => {
    const prefs: QuizPrefs = {
      maxPriceUsd: 60_000,
      minRangeMi: 250,
      bodyStyle: 'suv',
      minSeats: 5,
    }
    const match = makeCar({
      id: 'match',
      priceUsd: 40_000,
      rangeMi: 400,
      bodyStyle: 'suv',
      seats: 7,
    })
    const miss = makeCar({
      id: 'miss',
      priceUsd: 59_999,
      rangeMi: 251,
      bodyStyle: 'coupe',
      seats: 2,
    })
    expect(scoreCar(match, prefs)).toBeGreaterThan(scoreCar(miss, prefs))
  })

  test('an exact bodyStyle match scores higher than an off-style peer', () => {
    const prefs: QuizPrefs = { bodyStyle: 'truck' }
    const onStyle = makeCar({ id: 'truck', bodyStyle: 'truck' })
    const offStyle = makeCar({ id: 'sedan', bodyStyle: 'sedan' })
    expect(scoreCar(onStyle, prefs)).toBeGreaterThan(scoreCar(offStyle, prefs))
  })
})

describe('rankCars', () => {
  test('tightening maxPriceUsd reorders results so a cheaper car climbs', () => {
    const cheap = makeCar({ id: 'cheap', priceUsd: 30_000 })
    const pricey = makeCar({ id: 'pricey', priceUsd: 90_000 })
    const cars = [pricey, cheap]

    // With no budget pref the two are otherwise identical -> stable order kept.
    const noBudget = rankCars(cars, {})
    expect(noBudget.map((c) => c.id)).toEqual(['pricey', 'cheap'])

    // Introducing a budget makes the cheaper car the better fit -> it climbs.
    const tight = rankCars(cars, { maxPriceUsd: 95_000 })
    expect(tight[0]?.id).toBe('cheap')
  })

  test('an exact bodyStyle match raises that car above an off-style peer', () => {
    const sedan = makeCar({ id: 'sedan', bodyStyle: 'sedan' })
    const suv = makeCar({ id: 'suv', bodyStyle: 'suv' })
    const ranked = rankCars([sedan, suv], { bodyStyle: 'suv' })
    expect(ranked[0]?.id).toBe('suv')
  })

  test('does NOT mutate its input array (order or identity)', () => {
    const a = makeCar({ id: 'a', priceUsd: 80_000 })
    const b = makeCar({ id: 'b', priceUsd: 30_000 })
    const input = [a, b]
    const snapshot = [...input]

    const ranked = rankCars(input, { maxPriceUsd: 90_000 })

    // Input untouched: same length, same order, same identities, new array out.
    expect(input).toHaveLength(snapshot.length)
    expect(input).toEqual(snapshot)
    expect(input[0]).toBe(a)
    expect(input[1]).toBe(b)
    expect(ranked).not.toBe(input)
  })

  test('empty prefs ({}) returns all cars without throwing, preserving order', () => {
    const cars = [
      makeCar({ id: 'x' }),
      makeCar({ id: 'y' }),
      makeCar({ id: 'z' }),
    ]
    const ranked = rankCars(cars, {})
    expect(ranked).toHaveLength(3)
    // No criteria set -> every car ties -> stable sort keeps the original order.
    expect(ranked.map((c) => c.id)).toEqual(['x', 'y', 'z'])
  })
})

describe('matchBlurb (YOUR TURN stub)', () => {
  test('returns a non-empty fallback string', () => {
    expect(matchBlurb(makeCar({}), {}).length).toBeGreaterThan(0)
  })
})
