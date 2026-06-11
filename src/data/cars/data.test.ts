import { describe, expect, test } from 'vitest'

import { CarSchema } from '../../lib/car-schema'
import { cars } from './index'

describe('car fixtures', () => {
  test('parses without throwing', () => {
    expect(() => CarSchema.array().parse(cars)).not.toThrow()
  })

  test('all ids are unique', () => {
    const ids = cars.map((car) => car.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  test('fixture length is at least 5', () => {
    expect(cars.length).toBeGreaterThanOrEqual(5)
  })

  test('each car passes CarSchema validation', () => {
    for (const car of cars) {
      expect(CarSchema.safeParse(car).success).toBe(true)
    }
  })
})
