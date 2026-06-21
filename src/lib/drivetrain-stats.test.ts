import { describe, expect, test } from 'vitest'

import type { Car } from '@/lib/car-schema'
import {
  drivetrainDistribution,
  drivetrainShare,
} from '@/lib/drivetrain-stats'

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

describe('drivetrainDistribution', () => {
  test('empty input -> []', () => {
    expect(drivetrainDistribution([])).toEqual([])
  })

  test('counts each drivetrain correctly and the total equals the input length', () => {
    const cars = [
      makeCar({ drivetrain: 'AWD' }),
      makeCar({ drivetrain: 'AWD' }),
      makeCar({ drivetrain: 'AWD' }),
      makeCar({ drivetrain: 'RWD' }),
      makeCar({ drivetrain: 'RWD' }),
      makeCar({ drivetrain: 'FWD' }),
    ]
    const rows = drivetrainDistribution(cars)
    expect(rows).toEqual([
      { drivetrain: 'AWD', count: 3 },
      { drivetrain: 'RWD', count: 2 },
      { drivetrain: 'FWD', count: 1 },
    ])
    const total = rows.reduce((sum, r) => sum + r.count, 0)
    expect(total).toBe(cars.length)
  })

  test('orders by count descending (the 3-count row precedes the 2-count row)', () => {
    const cars = [
      makeCar({ drivetrain: 'RWD' }),
      makeCar({ drivetrain: 'RWD' }),
      makeCar({ drivetrain: 'AWD' }),
      makeCar({ drivetrain: 'AWD' }),
      makeCar({ drivetrain: 'AWD' }),
    ]
    const rows = drivetrainDistribution(cars)
    expect(rows[0]).toEqual({ drivetrain: 'AWD', count: 3 })
    expect(rows[1]).toEqual({ drivetrain: 'RWD', count: 2 })
    expect(rows[0].count).toBeGreaterThan(rows[1].count)
  })

  test('breaks ties alphabetically (AWD before RWD) and drops zero-count drivetrains', () => {
    const cars = [
      makeCar({ drivetrain: 'RWD' }),
      makeCar({ drivetrain: 'RWD' }),
      makeCar({ drivetrain: 'AWD' }),
      makeCar({ drivetrain: 'AWD' }),
    ]
    const rows = drivetrainDistribution(cars)
    expect(rows).toEqual([
      { drivetrain: 'AWD', count: 2 },
      { drivetrain: 'RWD', count: 2 },
    ])
    // A drivetrain with zero cars (e.g. FWD) never appears in the result.
    expect(rows.some((r) => r.drivetrain === 'FWD')).toBe(false)
  })

  test('does not mutate the input array (length + first element identity unchanged)', () => {
    const cars = [
      makeCar({ drivetrain: 'RWD' }),
      makeCar({ drivetrain: 'AWD' }),
    ]
    const lengthBefore = cars.length
    const firstBefore = cars[0]
    drivetrainDistribution(cars)
    expect(cars.length).toBe(lengthBefore)
    expect(cars[0]).toBe(firstBefore)
  })
})

describe('drivetrainShare', () => {
  test('returns a non-empty string (YOUR TURN stub)', () => {
    expect(drivetrainShare([makeCar({})], 'AWD').length).toBeGreaterThan(0)
  })
})
