import { describe, expect, test } from 'vitest'

import type { Car } from '@/lib/car-schema'
import {
  connectorNote,
  estimateDcFastChargeMinutes,
  formatChargeWindow,
} from '@/lib/charge-time'

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

describe('estimateDcFastChargeMinutes', () => {
  test('returns an integer', () => {
    const minutes = estimateDcFastChargeMinutes(makeCar({}))
    expect(Number.isInteger(minutes)).toBe(true)
  })

  test('a bigger pack takes strictly longer at the same peak kW', () => {
    const small = estimateDcFastChargeMinutes(
      makeCar({ batteryGrossKwh: 58, maxDcChargeKw: 175 }),
    )
    const large = estimateDcFastChargeMinutes(
      makeCar({ batteryGrossKwh: 100, maxDcChargeKw: 175 }),
    )
    expect(large).toBeGreaterThan(small)
  })

  test('a higher peak kW is strictly faster for the same pack', () => {
    const slow = estimateDcFastChargeMinutes(
      makeCar({ batteryGrossKwh: 78, maxDcChargeKw: 150 }),
    )
    const fast = estimateDcFastChargeMinutes(
      makeCar({ batteryGrossKwh: 78, maxDcChargeKw: 250 }),
    )
    expect(fast).toBeLessThan(slow)
  })

  test('a realistic 78 kWh / 250 kW car lands in a sane 20–35 min window', () => {
    const minutes = estimateDcFastChargeMinutes(
      makeCar({ batteryGrossKwh: 78, maxDcChargeKw: 250 }),
    )
    expect(minutes).toBeGreaterThanOrEqual(18)
    expect(minutes).toBeLessThanOrEqual(35)
  })
})

describe('formatChargeWindow', () => {
  test('renders an approximate minutes label', () => {
    expect(formatChargeWindow(27)).toBe('~27 min')
  })
})

describe('connectorNote', () => {
  test('returns a non-empty fallback note (YOUR TURN stub)', () => {
    expect(connectorNote(makeCar({})).length).toBeGreaterThan(0)
  })
})
