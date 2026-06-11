import { describe, expect, test } from 'vitest'

import type { Car } from './car-schema'
import { type CarFilterParams, applyFilters, parseFilterParams } from './car-filters'

const fixtures: Car[] = [
  {
    id: 'alpha-sedan',
    make: 'Alpha',
    model: 'Volt',
    variant: 'Touring',
    year: 2025,
    bodyStyle: 'sedan',
    priceUsd: 40_000,
    rangeMi: 310,
    rangeSource: 'EPA',
    batteryGrossKwh: 80,
    batteryNetKwh: 75,
    maxDcChargeKw: 210,
    zeroToSixtySec: 4.2,
    topSpeedMph: 130,
    powerHp: 410,
    powerKw: 306,
    torqueLbFt: 430,
    drivetrain: 'AWD',
    efficiencyWhPerMi: 250,
    seats: 5,
    cargoCuFt: 18,
    imageUrl: 'https://upload.wikimedia.org/example/alpha.jpg',
    imageAttribution: 'Tester, CC BY-SA 4.0',
    accentColor: '#112233',
  },
  {
    id: 'beta-suv',
    make: 'Beta',
    model: 'Ridge',
    variant: 'Adventure',
    year: 2024,
    bodyStyle: 'suv',
    priceUsd: 65_000,
    rangeMi: 280,
    rangeSource: 'EPA',
    batteryGrossKwh: 95,
    batteryNetKwh: 90,
    maxDcChargeKw: 250,
    zeroToSixtySec: 3.6,
    topSpeedMph: 145,
    powerHp: 520,
    powerKw: 388,
    torqueLbFt: 610,
    drivetrain: 'RWD',
    efficiencyWhPerMi: 340,
    seats: 7,
    cargoCuFt: 72,
    imageUrl: 'https://upload.wikimedia.org/example/beta.jpg',
    imageAttribution: 'Tester, CC BY-SA 4.0',
    accentColor: '#223344',
  },
  {
    id: 'gamma-hatch',
    make: 'Gamma',
    model: 'City',
    variant: 'Select',
    year: 2023,
    bodyStyle: 'hatchback',
    priceUsd: 29_000,
    rangeMi: 220,
    rangeSource: 'EPA',
    batteryGrossKwh: 58,
    batteryNetKwh: 55,
    maxDcChargeKw: 120,
    zeroToSixtySec: 7.1,
    topSpeedMph: 102,
    powerHp: 180,
    powerKw: 134,
    torqueLbFt: 210,
    drivetrain: 'FWD',
    efficiencyWhPerMi: 215,
    seats: 5,
    cargoCuFt: 24,
    imageUrl: 'https://upload.wikimedia.org/example/gamma.jpg',
    imageAttribution: 'Tester, CC BY-SA 4.0',
    accentColor: '#334455',
  },
]

describe('applyFilters', () => {
  test('filters by make, body, drive, price range, range minimum, and q search', () => {
    const params: CarFilterParams = {
      make: ['Alpha'],
      body: ['sedan'],
      drive: ['AWD'],
      priceMin: 35_000,
      priceMax: 45_000,
      rangeMin: 300,
      q: 'tour',
    }

    expect(applyFilters(fixtures, params).map((car) => car.id)).toEqual(['alpha-sedan'])
  })

  test.each([
    ['price', ['gamma-hatch', 'alpha-sedan', 'beta-suv'], ['beta-suv', 'alpha-sedan', 'gamma-hatch']],
    ['range', ['gamma-hatch', 'beta-suv', 'alpha-sedan'], ['alpha-sedan', 'beta-suv', 'gamma-hatch']],
    ['efficiency', ['gamma-hatch', 'alpha-sedan', 'beta-suv'], ['beta-suv', 'alpha-sedan', 'gamma-hatch']],
    ['zeroToSixty', ['beta-suv', 'alpha-sedan', 'gamma-hatch'], ['gamma-hatch', 'alpha-sedan', 'beta-suv']],
    ['name', ['alpha-sedan', 'beta-suv', 'gamma-hatch'], ['gamma-hatch', 'beta-suv', 'alpha-sedan']],
  ] as const)('sorts by %s in asc and desc', (sort, ascIds, descIds) => {
    expect(applyFilters(fixtures, { sort, dir: 'asc' }).map((car) => car.id)).toEqual(ascIds)
    expect(applyFilters(fixtures, { sort, dir: 'desc' }).map((car) => car.id)).toEqual(descIds)
  })
})

describe('parseFilterParams', () => {
  test('parses comma-separated arrays and numeric values', () => {
    const parsed = parseFilterParams(
      new URLSearchParams(
        'make=Tesla,Ford&body=sedan,suv&drive=AWD,RWD&priceMin=30000&priceMax=80000&rangeMin=250&q=model&sort=range&dir=desc',
      ),
    )

    expect(parsed).toEqual({
      make: ['Tesla', 'Ford'],
      body: ['sedan', 'suv'],
      drive: ['AWD', 'RWD'],
      priceMin: 30000,
      priceMax: 80000,
      rangeMin: 250,
      q: 'model',
      sort: 'range',
      dir: 'desc',
    })
  })

  test('silently drops invalid values', () => {
    const parsed = parseFilterParams(
      new URLSearchParams(
        'make=Tesla,, &body=sedan,spaceship&drive=AWD,4WD&priceMin=nope&priceMax=Infinity&rangeMin=-1&q=  &sort=mass&dir=sideways',
      ),
    )

    expect(parsed).toEqual({
      make: ['Tesla'],
      body: ['sedan'],
      drive: ['AWD'],
    })
  })
})
