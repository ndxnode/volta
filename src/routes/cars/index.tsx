import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { PageHeader } from '@/components/shared/page-header'
import { CarGrid } from '@/components/cars/car-grid'
import {
  FilterPanel,
  FilterRail,
  type FilterValues,
} from '@/components/cars/filter-panel'
import {
  FilterChips,
  priceChipLabel,
  rangeChipLabel,
  type ActiveChip,
} from '@/components/cars/filter-chips'
import { SortSelect } from '@/components/cars/sort-select'
import { CAR_SORT_KEYS } from '@/lib/car-schema'
import { applyFilters, type CarFilterParams } from '@/lib/car-filters'
import { carsQueryOptions } from '@/lib/queries'

const carsSearchSchema = z.object({
  make: z.array(z.string()).catch([]),
  body: z.array(z.string()).catch([]),
  drive: z.array(z.string()).catch([]),
  priceMin: z.number().optional().catch(undefined),
  priceMax: z.number().optional().catch(undefined),
  rangeMin: z.number().optional().catch(undefined),
  q: z.string().catch(''),
  sort: z.enum(CAR_SORT_KEYS).catch('name'),
  dir: z.enum(['asc', 'desc']).catch('asc'),
})

type CarsSearch = z.infer<typeof carsSearchSchema>

export const Route = createFileRoute('/cars/')({
  // Accept a partial input so links to /cars need not restate every param;
  // `.catch()` on each field fills the defaults at parse time.
  validateSearch: (input: Partial<CarsSearch>): CarsSearch => carsSearchSchema.parse(input),
  loader: ({ context }) => context.queryClient.ensureQueryData(carsQueryOptions()),
  component: BrowsePage,
})

function BrowsePage() {
  const cars = useSuspenseQuery(carsQueryOptions()).data
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const setSearch = React.useCallback(
    (patch: Partial<CarsSearch>) => {
      navigate({ search: (prev) => ({ ...prev, ...patch }) })
    },
    [navigate],
  )

  // search already matches CarFilterParams field-for-field; an empty `q` is harmless.
  const filterParams: CarFilterParams = search
  const filtered = React.useMemo(() => applyFilters(cars, filterParams), [cars, filterParams])

  const makeOptions = React.useMemo(
    () => Array.from(new Set(cars.map((car) => car.make))).sort((a, b) => a.localeCompare(b)),
    [cars],
  )

  const filterValues: FilterValues = {
    make: search.make,
    body: search.body,
    drive: search.drive,
    priceMin: search.priceMin,
    priceMax: search.priceMax,
    rangeMin: search.rangeMin,
  }

  const activeCount =
    search.make.length +
    search.body.length +
    search.drive.length +
    (search.priceMin !== undefined || search.priceMax !== undefined ? 1 : 0) +
    (search.rangeMin !== undefined ? 1 : 0) +
    (search.q ? 1 : 0)

  const chips = buildChips(search)

  const removeChip = (key: string) => {
    if (key === 'price') {
      setSearch({ priceMin: undefined, priceMax: undefined })
      return
    }
    if (key === 'rangeMin') {
      setSearch({ rangeMin: undefined })
      return
    }
    if (key === 'q') {
      setSearch({ q: '' })
      return
    }
    const [group, ...rest] = key.split(':')
    const value = rest.join(':')
    if (group === 'make') setSearch({ make: search.make.filter((m) => m !== value) })
    if (group === 'body') setSearch({ body: search.body.filter((b) => b !== value) })
    if (group === 'drive') setSearch({ drive: search.drive.filter((d) => d !== value) })
  }

  const clearAll = () => {
    setSearch({
      make: [],
      body: [],
      drive: [],
      priceMin: undefined,
      priceMax: undefined,
      rangeMin: undefined,
      q: '',
    })
  }

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:py-14">
      <PageHeader
        title="Browse the lineup"
        gradient
        subtitle="Every electric car in the VOLTA index. Filter, sort, and find the one that fits."
      />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FilterPanel
            makeOptions={makeOptions}
            values={filterValues}
            onChange={(patch) => setSearch(patch)}
            activeCount={activeCount}
          />
          <p className="font-mono text-sm tabular-nums text-muted-foreground" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'car' : 'cars'}
          </p>
        </div>
        <SortSelect
          sort={search.sort}
          dir={search.dir}
          onSortChange={(sort) => setSearch({ sort })}
          onDirChange={(dir) => setSearch({ dir })}
        />
      </div>

      {chips.length > 0 ? (
        <div className="mt-4">
          <FilterChips chips={chips} onRemove={removeChip} onClearAll={clearAll} />
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[15rem_1fr]">
        <FilterRail
          makeOptions={makeOptions}
          values={filterValues}
          onChange={(patch) => setSearch(patch)}
        />
        <CarGrid cars={filtered} />
      </div>
    </div>
  )
}

function buildChips(search: CarsSearch): ActiveChip[] {
  const chips: ActiveChip[] = []

  search.make.forEach((make) => chips.push({ key: `make:${make}`, label: make }))
  search.body.forEach((body) => chips.push({ key: `body:${body}`, label: body }))
  search.drive.forEach((drive) => chips.push({ key: `drive:${drive}`, label: drive }))

  const price = priceChipLabel(search.priceMin, search.priceMax)
  if (price) chips.push({ key: 'price', label: price })

  const range = rangeChipLabel(search.rangeMin)
  if (range) chips.push({ key: 'rangeMin', label: range })

  if (search.q) chips.push({ key: 'q', label: `“${search.q}”` })

  return chips
}
