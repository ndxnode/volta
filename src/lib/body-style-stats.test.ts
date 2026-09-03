import { describe, expect, test } from 'vitest'

import type { Car } from '@/lib/car-schema'
import { bodyStyleDistribution, bodyStyleShare } from '@/lib/body-style-stats'

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

describe('bodyStyleDistribution', () => {
  test('empty input -> []', () => {
    expect(bodyStyleDistribution([])).toEqual([])
  })

  test('counts each style correctly and the total equals the input length', () => {
    const cars = [
      makeCar({ bodyStyle: 'sedan' }),
      makeCar({ bodyStyle: 'sedan' }),
      makeCar({ bodyStyle: 'sedan' }),
      makeCar({ bodyStyle: 'suv' }),
      makeCar({ bodyStyle: 'suv' }),
      makeCar({ bodyStyle: 'truck' }),
    ]
    const rows = bodyStyleDistribution(cars)
    expect(rows).toEqual([
      { bodyStyle: 'sedan', count: 3 },
      { bodyStyle: 'suv', count: 2 },
      { bodyStyle: 'truck', count: 1 },
    ])
    const total = rows.reduce((sum, r) => sum + r.count, 0)
    expect(total).toBe(cars.length)
  })

  test('orders by count descending (the 3-count row precedes the 2-count row)', () => {
    const cars = [
      makeCar({ bodyStyle: 'suv' }),
      makeCar({ bodyStyle: 'suv' }),
      makeCar({ bodyStyle: 'sedan' }),
      makeCar({ bodyStyle: 'sedan' }),
      makeCar({ bodyStyle: 'sedan' }),
    ]
    const rows = bodyStyleDistribution(cars)
    expect(rows[0]).toEqual({ bodyStyle: 'sedan', count: 3 })
    expect(rows[1]).toEqual({ bodyStyle: 'suv', count: 2 })
    expect(rows[0].count).toBeGreaterThan(rows[1].count)
  })

  test('breaks ties alphabetically (coupe before sedan) and drops zero-count styles', () => {
    const cars = [
      makeCar({ bodyStyle: 'sedan' }),
      makeCar({ bodyStyle: 'sedan' }),
      makeCar({ bodyStyle: 'coupe' }),
      makeCar({ bodyStyle: 'coupe' }),
    ]
    const rows = bodyStyleDistribution(cars)
    expect(rows).toEqual([
      { bodyStyle: 'coupe', count: 2 },
      { bodyStyle: 'sedan', count: 2 },
    ])
    // A style with zero cars (e.g. truck) never appears in the result.
    expect(rows.some((r) => r.bodyStyle === 'truck')).toBe(false)
  })

  test('does not mutate the input array (length + first element identity unchanged)', () => {
    const cars = [makeCar({ bodyStyle: 'suv' }), makeCar({ bodyStyle: 'sedan' })]
    const lengthBefore = cars.length
    const firstBefore = cars[0]
    bodyStyleDistribution(cars)
    expect(cars.length).toBe(lengthBefore)
    expect(cars[0]).toBe(firstBefore)
  })
})

describe('bodyStyleShare', () => {
  test('returns a non-empty string (YOUR TURN stub)', () => {
    expect(bodyStyleShare([makeCar({})], 'sedan').length).toBeGreaterThan(0)
  })
})
