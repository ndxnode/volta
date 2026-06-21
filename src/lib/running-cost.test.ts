import { describe, expect, test } from 'vitest'

import type { Car } from '@/lib/car-schema'
import {
  costComparisonNote,
  estimateAnnualEnergyCost,
  estimateCostPerMile,
  formatAnnualCost,
  formatCostPerMile,
} from '@/lib/running-cost'

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

describe('estimateAnnualEnergyCost', () => {
  test('returns an integer', () => {
    const cost = estimateAnnualEnergyCost(makeCar({}))
    expect(Number.isInteger(cost)).toBe(true)
  })

  test('a less-efficient car (higher Wh/mi) costs strictly more', () => {
    const efficient = estimateAnnualEnergyCost(makeCar({ efficiencyWhPerMi: 220 }))
    const thirsty = estimateAnnualEnergyCost(makeCar({ efficiencyWhPerMi: 400 }))
    expect(thirsty).toBeGreaterThan(efficient)
  })

  test('scales with miles driven (24k > 12k)', () => {
    const car = makeCar({ efficiencyWhPerMi: 250 })
    const lower = estimateAnnualEnergyCost(car, 12_000)
    const higher = estimateAnnualEnergyCost(car, 24_000)
    expect(higher).toBeGreaterThan(lower)
  })

  test('a realistic 250 Wh/mi car @ 12k mi @ $0.17 lands in a sane window', () => {
    const cost = estimateAnnualEnergyCost(makeCar({ efficiencyWhPerMi: 250 }), 12_000, 0.17)
    expect(cost).toBeGreaterThanOrEqual(500)
    expect(cost).toBeLessThanOrEqual(650)
  })
})

describe('estimateCostPerMile', () => {
  test('is positive', () => {
    expect(estimateCostPerMile(makeCar({ efficiencyWhPerMi: 250 }))).toBeGreaterThan(0)
  })
})

describe('formatCostPerMile', () => {
  test('renders a $X.XX/mi label', () => {
    const label = formatCostPerMile(0.0425)
    expect(label.startsWith('$')).toBe(true)
    expect(label.endsWith('/mi')).toBe(true)
    expect(label).toBe('$0.04/mi')
  })
})

describe('formatAnnualCost', () => {
  test('renders a ~$X/yr label', () => {
    const label = formatAnnualCost(566)
    expect(label.startsWith('~$')).toBe(true)
    expect(label.endsWith('/yr')).toBe(true)
    expect(label).toBe('~$566/yr')
  })
})

describe('costComparisonNote', () => {
  test('returns a non-empty fallback note (YOUR TURN stub)', () => {
    expect(costComparisonNote(makeCar({})).length).toBeGreaterThan(0)
  })
})
