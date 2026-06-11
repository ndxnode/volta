import { createFileRoute } from '@tanstack/react-router'

import { cars } from '@/data/cars'
import { applyFilters, parseFilterParams } from '@/lib/car-filters'

export const Route = (createFileRoute('/api/cars') as (options: {
  server: {
    handlers: {
      GET: (context: { request: Request }) => Promise<Response>
    }
  }
}) => unknown)({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams
        const result = applyFilters(cars, parseFilterParams(params))

        return Response.json(result, {
          headers: {
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          },
        })
      },
    },
  },
})
