import { describe, expect, test } from 'vitest'

import type { Car } from '@/lib/car-schema'
import {
  carFullName,
  serializeCompareCsv,
  type CompareCsvRow,
} from '@/lib/compare-csv'

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

const rows: CompareCsvRow[] = [
  { label: 'Range', value: (car) => String(car.rangeMi) },
  { label: 'Price', value: (car) => String(car.priceUsd) },
]

describe('serializeCompareCsv', () => {
  test('builds a header of Spec + full car names and one line per row', () => {
    const a = makeCar({ id: 'a', model: 'Model 3', rangeMi: 346, priceUsd: 47_490 })
    const b = makeCar({
      id: 'b',
      make: 'Hyundai',
      model: 'IONIQ 5',
      variant: 'Limited AWD',
      year: 2026,
      rangeMi: 303,
      priceUsd: 52_700,
    })

    const csv = serializeCompareCsv([a, b], rows)
    const lines = csv.split('\r\n')

    expect(lines).toEqual([
      'Spec,2025 Tesla Model 3 Long Range AWD,2026 Hyundai IONIQ 5 Limited AWD',
      'Range,346,303',
      'Price,47490,52700',
    ])
  })

  test('uses CRLF line endings (RFC-4180)', () => {
    const csv = serializeCompareCsv([makeCar({ id: 'a' })], rows)

    expect(csv.split('\r\n')).toHaveLength(3)
    expect(csv).not.toMatch(/[^\r]\n/)
  })

  test('RFC-4180 escapes fields containing a comma and a double quote', () => {
    // Variant carries both a comma and an embedded double quote.
    const car = makeCar({ id: 'a', variant: 'Performance, 21" wheels' })

    const csv = serializeCompareCsv([car], [{ label: 'Range', value: (c) => String(c.rangeMi) }])
    const [headerLine] = csv.split('\r\n')

    // Interior quotes doubled, whole field wrapped in quotes.
    expect(carFullName(car)).toBe('2025 Tesla Model 3 Performance, 21" wheels')
    expect(headerLine).toBe(
      'Spec,"2025 Tesla Model 3 Performance, 21"" wheels"',
    )
  })

  test('escapes values containing newlines', () => {
    const csv = serializeCompareCsv(
      [makeCar({ id: 'a' })],
      [{ label: 'Notes', value: () => 'line1\nline2' }],
    )

    expect(csv).toContain('"line1\nline2"')
  })
})
