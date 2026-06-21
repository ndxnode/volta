import { describe, expect, test } from 'vitest'

import type { Car } from '@/lib/car-schema'
import { seatsDistribution, seatsShare } from '@/lib/seats-stats'

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

const FIXED_ORDER = ['2', '3', '4', '5', '6', '7', '8']

describe('seatsDistribution', () => {
  test('empty input -> all seven bands present at count 0 in fixed order (NOT [])', () => {
    const rows = seatsDistribution([])
    expect(rows).toEqual([
      { band: '2', count: 0 },
      { band: '3', count: 0 },
      { band: '4', count: 0 },
      { band: '5', count: 0 },
      { band: '6', count: 0 },
      { band: '7', count: 0 },
      { band: '8', count: 0 },
    ])
  })

  test('one car per populated value -> correct counts; total equals input length', () => {
    const cars = [
      makeCar({ seats: 2 }),
      makeCar({ seats: 4 }),
      makeCar({ seats: 5 }),
      makeCar({ seats: 7 }),
      makeCar({ seats: 8 }),
    ]
    const rows = seatsDistribution(cars)
    const byBand = Object.fromEntries(rows.map((r) => [r.band, r.count]))
    expect(byBand['2']).toBe(1)
    expect(byBand['4']).toBe(1)
    expect(byBand['5']).toBe(1)
    expect(byBand['7']).toBe(1)
    expect(byBand['8']).toBe(1)
    const total = rows.reduce((sum, r) => sum + r.count, 0)
    expect(total).toBe(cars.length)
  })

  test('the gap values 3 and 6 stay at 0 when only 2/4/5/7/8 are fed (all bands seeded)', () => {
    const rows = seatsDistribution([
      makeCar({ seats: 2 }),
      makeCar({ seats: 4 }),
      makeCar({ seats: 5 }),
      makeCar({ seats: 7 }),
      makeCar({ seats: 8 }),
    ])
    const byBand = Object.fromEntries(rows.map((r) => [r.band, r.count]))
    expect(byBand['3']).toBe(0)
    expect(byBand['6']).toBe(0)
  })

  test('order is the FIXED ascending list regardless of insertion order (NOT count-sorted)', () => {
    // Feed seats high-to-low with uneven counts; a count-DESC sort would put '8' first.
    const cars = [
      makeCar({ seats: 8 }),
      makeCar({ seats: 8 }),
      makeCar({ seats: 8 }),
      makeCar({ seats: 5 }),
      makeCar({ seats: 5 }),
      makeCar({ seats: 2 }),
    ]
    const rows = seatsDistribution(cars)
    expect(rows.map((r) => r.band)).toEqual(FIXED_ORDER)
  })

  test('dataset extremes 2 and 8 land in the edge bands', () => {
    const rows = seatsDistribution([
      makeCar({ seats: 2 }),
      makeCar({ seats: 8 }),
    ])
    const byBand = Object.fromEntries(rows.map((r) => [r.band, r.count]))
    expect(byBand['2']).toBe(1)
    expect(byBand['8']).toBe(1)
    expect(byBand['5']).toBe(0)
  })

  test('does not mutate the input array (length + first element identity unchanged)', () => {
    const cars = [makeCar({ seats: 2 }), makeCar({ seats: 8 })]
    const lengthBefore = cars.length
    const firstBefore = cars[0]
    seatsDistribution(cars)
    expect(cars.length).toBe(lengthBefore)
    expect(cars[0]).toBe(firstBefore)
  })
})

describe('seatsShare', () => {
  test('returns a non-empty string (YOUR TURN stub)', () => {
    expect(seatsShare([makeCar({})], '5').length).toBeGreaterThan(0)
  })
})
