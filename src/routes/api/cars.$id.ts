import { createFileRoute } from '@tanstack/react-router'

import { cars } from '@/data/cars'

export const Route = (createFileRoute('/api/cars/$id') as (options: {
  server: {
    handlers: {
      GET: (context: { params: { id: string } }) => Promise<Response>
    }
  }
}) => unknown)({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const car = cars.find((candidate) => candidate.id === params.id)

        if (!car) {
          return Response.json({ error: 'not_found' }, { status: 404 })
        }

        return Response.json(car)
      },
    },
  },
})
