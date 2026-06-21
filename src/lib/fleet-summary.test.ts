import { describe, expect, test } from 'vitest'

import type { Car } from '@/lib/car-schema'
import { formatPrice } from '@/lib/format'
import {
  EMPTY_FLEET_SUMMARY,
  fleetSummary,
  priceSpread,
} from '@/lib/fleet-summary'

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

describe('fleetSummary', () => {
  test('empty input -> EMPTY_FLEET_SUMMARY', () => {
    expect(fleetSummary([])).toBe(EMPTY_FLEET_SUMMARY)
  })

  test('odd count picks the MIDDLE price as the median', () => {
    const cars = [
      makeCar({ priceUsd: 30_000 }),
      makeCar({ priceUsd: 50_000 }),
      makeCar({ priceUsd: 90_000 }),
    ]
    const out = fleetSummary(cars)
    expect(out).toContain(`median ${formatPrice(50_000)}`)
    expect(out).not.toContain(formatPrice(30_000))
    expect(out).not.toContain(formatPrice(90_000))
    expect(out).toContain('3 EVs')
  })

  test('even count averages the two middle prices', () => {
    const cars = [
      makeCar({ priceUsd: 40_000 }),
      makeCar({ priceUsd: 50_000 }),
      makeCar({ priceUsd: 60_000 }),
      makeCar({ priceUsd: 90_000 }),
    ]
    // sorted middles are 50k + 60k -> mean 55k, NOT just prices[mid] (60k)
    const out = fleetSummary(cars)
    expect(out).toContain(`median ${formatPrice(55_000)}`)
    expect(out).not.toContain(formatPrice(60_000))
  })

  test('median is order-independent (internal sort, not insertion order)', () => {
    const ascending = [
      makeCar({ priceUsd: 30_000 }),
      makeCar({ priceUsd: 50_000 }),
      makeCar({ priceUsd: 90_000 }),
    ]
    const descending = [
      makeCar({ priceUsd: 90_000 }),
      makeCar({ priceUsd: 50_000 }),
      makeCar({ priceUsd: 30_000 }),
    ]
    expect(fleetSummary(descending)).toBe(fleetSummary(ascending))
  })

  test('longest range is the MAX, not the last element', () => {
    const cars = [
      makeCar({ rangeMi: 500 }),
      makeCar({ rangeMi: 300 }),
      makeCar({ rangeMi: 412 }),
    ]
    expect(fleetSummary(cars)).toContain('longest range 500 mi')
  })

  test('does not mutate the input array', () => {
    const cars = [
      makeCar({ priceUsd: 90_000 }),
      makeCar({ priceUsd: 30_000 }),
      makeCar({ priceUsd: 50_000 }),
    ]
    const length = cars.length
    const first = cars[0]
    fleetSummary(cars)
    expect(cars.length).toBe(length)
    expect(cars[0]).toBe(first)
    expect(cars[0].priceUsd).toBe(90_000)
  })
})

describe('priceSpread', () => {
  test('stub returns the em dash placeholder', () => {
    expect(priceSpread([makeCar({ priceUsd: 31_990 })])).toBe('—')
  })
})
