import { queryOptions } from '@tanstack/react-query'

import { CarSchema } from '@/lib/car-schema'

export function carsQueryOptions() {
  return queryOptions({
    queryKey: ['cars'],
    staleTime: Infinity,
    queryFn: async () => {
      if (import.meta.env.SSR) {
        const { cars } = await import('@/data/cars')
        return cars
      }

      const response = await fetch('/api/cars')

      if (!response.ok) {
        throw new Error('cars fetch failed')
      }

      return CarSchema.array().parse(await response.json())
    },
  })
}

export function carQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['cars', id],
    staleTime: Infinity,
    queryFn: async () => {
      if (import.meta.env.SSR) {
        const { cars } = await import('@/data/cars')
        const car = cars.find((candidate) => candidate.id === id)

        if (!car) {
          throw new Error('not_found')
        }

        return car
      }

      const response = await fetch(`/api/cars/${encodeURIComponent(id)}`)

      if (response.status === 404) {
        throw new Error('not_found')
      }

      if (!response.ok) {
        throw new Error('car fetch failed')
      }

      return CarSchema.parse(await response.json())
    },
  })
}
