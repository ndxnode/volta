import { describe, expect, test } from 'vitest'

import type { Car } from '@/lib/car-schema'
import { MAX_COMPARE_IDS, resolveDeepLinkCars } from '@/lib/compare-config'

function makeCar(id: string): Car {
  return {
    id,
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
  }
}

function mapOf(ids: string[]): ReadonlyMap<string, Car> {
  return new Map(ids.map((id) => [id, makeCar(id)] as const))
}

describe('resolveDeepLinkCars', () => {
  test('caps the resolved cars at MAX_COMPARE_IDS', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const resolved = resolveDeepLinkCars(ids, mapOf(ids))
    expect(resolved).toHaveLength(MAX_COMPARE_IDS)
    expect(resolved.map((c) => c.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
    ])
  })

  test('preserves request order', () => {
    const ids = ['c', 'a', 'b']
    const resolved = resolveDeepLinkCars(ids, mapOf(['a', 'b', 'c']))
    expect(resolved.map((c) => c.id)).toEqual(['c', 'a', 'b'])
  })

  test('drops unknown ids, then still fills up to the cap from valid ones', () => {
    // Unknown ids interleaved: the cap must count *resolved* cars, not raw ids,
    // so 7 valid ids still yield 6 cars even with misses sprinkled in.
    const ids = ['a', 'zzz', 'b', 'c', 'd', 'nope', 'e', 'f', 'g']
    const known = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    const resolved = resolveDeepLinkCars(ids, mapOf(known))
    expect(resolved.map((c) => c.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
    ])
  })

  test('returns an empty array for no/unknown ids', () => {
    expect(resolveDeepLinkCars([], mapOf(['a']))).toEqual([])
    expect(resolveDeepLinkCars(['ghost'], mapOf(['a']))).toEqual([])
  })
})
