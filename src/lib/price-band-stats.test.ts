import { describe, expect, test } from 'vitest'

import type { Car } from '@/lib/car-schema'
import { priceBandDistribution, priceBandShare } from '@/lib/price-band-stats'

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

const FIXED_ORDER = ['<$40k', '$40-60k', '$60-80k', '$80k+']

describe('priceBandDistribution', () => {
  test('empty input -> all four bands present at count 0 in fixed order (NOT [])', () => {
    const rows = priceBandDistribution([])
    expect(rows).toEqual([
      { band: '<$40k', count: 0 },
      { band: '$40-60k', count: 0 },
      { band: '$60-80k', count: 0 },
      { band: '$80k+', count: 0 },
    ])
  })

  test('one car per band -> [1,1,1,1] in fixed order; total equals input length', () => {
    const cars = [
      makeCar({ priceUsd: 30_000 }),
      makeCar({ priceUsd: 50_000 }),
      makeCar({ priceUsd: 70_000 }),
      makeCar({ priceUsd: 90_000 }),
    ]
    const rows = priceBandDistribution(cars)
    expect(rows).toEqual([
      { band: '<$40k', count: 1 },
      { band: '$40-60k', count: 1 },
      { band: '$60-80k', count: 1 },
      { band: '$80k+', count: 1 },
    ])
    const total = rows.reduce((sum, r) => sum + r.count, 0)
    expect(total).toBe(cars.length)
  })

  test('boundary cars land in the HIGHER band (upper-exclusive cutoffs)', () => {
    const rows = priceBandDistribution([
      makeCar({ priceUsd: 40_000 }),
      makeCar({ priceUsd: 60_000 }),
      makeCar({ priceUsd: 80_000 }),
    ])
    const byBand = Object.fromEntries(rows.map((r) => [r.band, r.count]))
    // 40000 -> $40-60k (NOT <$40k); 60000 -> $60-80k; 80000 -> $80k+
    expect(byBand['<$40k']).toBe(0)
    expect(byBand['$40-60k']).toBe(1)
    expect(byBand['$60-80k']).toBe(1)
    expect(byBand['$80k+']).toBe(1)
  })

  test('just-below-edge cars stay in the lower band', () => {
    const rows = priceBandDistribution([
      makeCar({ priceUsd: 39_999 }),
      makeCar({ priceUsd: 59_999 }),
      makeCar({ priceUsd: 79_999 }),
    ])
    const byBand = Object.fromEntries(rows.map((r) => [r.band, r.count]))
    expect(byBand['<$40k']).toBe(1)
    expect(byBand['$40-60k']).toBe(1)
    expect(byBand['$60-80k']).toBe(1)
    expect(byBand['$80k+']).toBe(0)
  })

  test('dataset extremes land in the edge bands (27000 -> <$40k, 340000 -> $80k+)', () => {
    const rows = priceBandDistribution([
      makeCar({ priceUsd: 27_000 }),
      makeCar({ priceUsd: 340_000 }),
    ])
    const byBand = Object.fromEntries(rows.map((r) => [r.band, r.count]))
    expect(byBand['<$40k']).toBe(1)
    expect(byBand['$80k+']).toBe(1)
    expect(byBand['$40-60k']).toBe(0)
    expect(byBand['$60-80k']).toBe(0)
  })

  test('order is the FIXED band list regardless of insertion order (NOT count-sorted)', () => {
    // Feed cars high-to-low; a count-DESC sort would put $80k+ first.
    const cars = [
      makeCar({ priceUsd: 90_000 }),
      makeCar({ priceUsd: 90_000 }),
      makeCar({ priceUsd: 90_000 }),
      makeCar({ priceUsd: 70_000 }),
      makeCar({ priceUsd: 70_000 }),
      makeCar({ priceUsd: 30_000 }),
    ]
    const rows = priceBandDistribution(cars)
    expect(rows.map((r) => r.band)).toEqual(FIXED_ORDER)
  })

  test('does not mutate the input array (length + first element identity unchanged)', () => {
    const cars = [
      makeCar({ priceUsd: 30_000 }),
      makeCar({ priceUsd: 90_000 }),
    ]
    const lengthBefore = cars.length
    const firstBefore = cars[0]
    priceBandDistribution(cars)
    expect(cars.length).toBe(lengthBefore)
    expect(cars[0]).toBe(firstBefore)
  })
})

describe('priceBandShare', () => {
  test('empty fleet -> "0%" (no divide-by-zero)', () => {
    expect(priceBandShare([], '$40-60k')).toBe('0%')
  })

  test('a band holding exactly half of the fleet -> "50%"', () => {
    const cars = [
      makeCar({ priceUsd: 50_000 }),
      makeCar({ priceUsd: 50_000 }),
      makeCar({ priceUsd: 90_000 }),
      makeCar({ priceUsd: 90_000 }),
    ]
    expect(priceBandShare(cars, '$40-60k')).toBe('50%')
  })

  test('rounds to a whole percent (one of three distinct -> "33%", Math.round not floor)', () => {
    const cars = [
      makeCar({ priceUsd: 30_000 }),
      makeCar({ priceUsd: 50_000 }),
      makeCar({ priceUsd: 90_000 }),
    ]
    // 1 / 3 = 33.33...% -> rounds to 33
    expect(priceBandShare(cars, '<$40k')).toBe('33%')
  })

  test('a populated fleet with no cars in the queried band -> "0%"', () => {
    expect(priceBandShare([makeCar({ priceUsd: 50_000 })], '$80k+')).toBe('0%')
  })

  test('shares across all four bands each look like N% and sum to ~100', () => {
    const cars = [
      makeCar({ priceUsd: 30_000 }),
      makeCar({ priceUsd: 50_000 }),
      makeCar({ priceUsd: 50_000 }),
      makeCar({ priceUsd: 70_000 }),
      makeCar({ priceUsd: 90_000 }),
    ]
    const bands = ['<$40k', '$40-60k', '$60-80k', '$80k+'] as const
    const shares = bands.map((b) => priceBandShare(cars, b))
    for (const s of shares) {
      expect(s).toMatch(/^\d+%$/)
    }
    const sum = shares.reduce((acc, s) => acc + Number.parseInt(s, 10), 0)
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(3)
  })
})
