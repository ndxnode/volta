import { BodyStyle, CAR_SORT_KEYS, Drivetrain, type Car, type SortKey } from './car-schema'

export interface CarFilterParams {
  make?: string[]
  body?: string[]
  drive?: string[]
  priceMin?: number
  priceMax?: number
  rangeMin?: number
  q?: string
  sort?: SortKey
  dir?: 'asc' | 'desc'
}

const SORT_KEY_SET = new Set<string>(CAR_SORT_KEYS)
const BODY_STYLE_SET = new Set<string>(BodyStyle.options)
const DRIVETRAIN_SET = new Set<string>(Drivetrain.options)

export function applyFilters(cars: Car[], p: CarFilterParams): Car[] {
  const query = p.q?.trim().toLocaleLowerCase()

  const filtered = cars.filter((car) => {
    if (p.make?.length && !p.make.includes(car.make)) return false
    if (p.body?.length && !p.body.includes(car.bodyStyle)) return false
    if (p.drive?.length && !p.drive.includes(car.drivetrain)) return false
    if (p.priceMin !== undefined && car.priceUsd < p.priceMin) return false
    if (p.priceMax !== undefined && car.priceUsd > p.priceMax) return false
    if (p.rangeMin !== undefined && car.rangeMi < p.rangeMin) return false
    if (query) {
      const name = `${car.make} ${car.model} ${car.variant}`.toLocaleLowerCase()
      if (!name.includes(query)) return false
    }

    return true
  })

  return [...filtered].sort((a, b) => {
    const sort = p.sort ?? 'name'
    const multiplier = p.dir === 'desc' ? -1 : 1

    return compareCars(a, b, sort) * multiplier
  })
}

export function parseFilterParams(sp: URLSearchParams): CarFilterParams {
  const parsed: CarFilterParams = {}
  const make = parseList(sp.get('make'))
  const body = parseList(sp.get('body')).filter((value) => BODY_STYLE_SET.has(value))
  const drive = parseList(sp.get('drive')).filter((value) => DRIVETRAIN_SET.has(value))
  const priceMin = parseNonNegativeNumber(sp.get('priceMin'))
  const priceMax = parseNonNegativeNumber(sp.get('priceMax'))
  const rangeMin = parseNonNegativeNumber(sp.get('rangeMin'))
  const q = sp.get('q')?.trim()
  const sort = sp.get('sort')
  const dir = sp.get('dir')

  if (make.length) parsed.make = make
  if (body.length) parsed.body = body
  if (drive.length) parsed.drive = drive
  if (priceMin !== undefined) parsed.priceMin = priceMin
  if (priceMax !== undefined) parsed.priceMax = priceMax
  if (rangeMin !== undefined) parsed.rangeMin = rangeMin
  if (q) parsed.q = q
  if (sort && SORT_KEY_SET.has(sort)) parsed.sort = sort as SortKey
  if (dir === 'asc' || dir === 'desc') parsed.dir = dir

  return parsed
}

function compareCars(a: Car, b: Car, sort: SortKey): number {
  switch (sort) {
    case 'price':
      return a.priceUsd - b.priceUsd
    case 'range':
      return a.rangeMi - b.rangeMi
    case 'efficiency':
      return a.efficiencyWhPerMi - b.efficiencyWhPerMi
    case 'zeroToSixty':
      return a.zeroToSixtySec - b.zeroToSixtySec
    case 'name':
      return `${a.make} ${a.model} ${a.variant}`.localeCompare(`${b.make} ${b.model} ${b.variant}`)
  }
}

function parseList(value: string | null): string[] {
  if (!value) return []

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseNonNegativeNumber(value: string | null): number | undefined {
  if (!value) return undefined

  const numeric = Number(value)

  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined
}
