import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const OPENE_EV_PATH = path.join(rootDir, 'data/seed/open-ev-data-v1.24.0.json')
const EPA_PATH = path.join(rootDir, 'data/seed/vehicles.csv')
const TESLA_FIXTURE_PATH = path.join(rootDir, 'src/data/cars/tesla.ts')
const OUT_DIR = path.join(rootDir, 'data/seed/groups')

const GROUPS = [
  { key: 'tesla', makes: ['Tesla'], count: 3 },
  { key: 'hyundai-kia-genesis', makes: ['Hyundai', 'Kia', 'Genesis'], count: 12 },
  { key: 'bmw-mini', makes: ['BMW', 'Mini'], count: 10 },
  { key: 'mercedes-smart', makes: ['Mercedes-Benz', 'Smart'], count: 9 },
  { key: 'audi-porsche', makes: ['Audi', 'Porsche'], count: 10 },
  { key: 'vw-group', makes: ['Volkswagen', 'Skoda', 'Cupra', 'SEAT'], count: 9 },
  { key: 'ford-gm', makes: ['Ford', 'Chevrolet', 'Cadillac', 'GMC'], count: 11 },
  { key: 'startups', makes: ['Rivian', 'Lucid', 'Polestar', 'Volvo', 'Fisker'], count: 10 },
  { key: 'japan', makes: ['Nissan', 'Toyota', 'Honda', 'Subaru', 'Lexus', 'Mazda'], count: 10 },
  { key: 'china-europe', makes: ['BYD', 'NIO', 'XPeng', 'Zeekr', 'MG', 'Renault', 'Fiat', 'Peugeot', 'Citroen', 'Opel'], count: 11 },
]

// Hard-coded from src/lib/car-schema.ts after reading the contract schema.
const BOUNDS = {
  year: [2020, 2026],
  priceUsd: [15_000, 350_000],
  rangeMi: [80, 600],
  batteryGrossKwh: [20, 250],
  batteryNetKwh: [15, 250],
  maxDcChargeKw: [40, 500],
  zeroToSixtySec: [1.5, 12],
  topSpeedMph: [80, 220],
  powerHp: [80, 1300],
  powerKw: [60, 1000],
  torqueLbFt: [100, 1200],
  seats: [2, 8],
  efficiencyWhPerMi: [180, 600],
}

const BODY_STYLE_MAP = new Map([
  ['sedan', 'sedan'],
  ['suv', 'suv'],
  ['crossover', 'crossover'],
  ['mini_suv', 'crossover'],
  ['suv_coupe', 'crossover'],
  ['hatchback', 'hatchback'],
  ['liftback', 'hatchback'],
  ['fastback', 'sedan'],
  ['coupe', 'coupe'],
  ['convertible', 'coupe'],
  ['pickup', 'truck'],
  ['truck', 'truck'],
  ['van', 'van'],
  ['microvan', 'van'],
  ['minivan', 'van'],
  ['mpv', 'van'],
  ['station wagon', 'wagon'],
  ['wagon', 'wagon'],
  ['shooting_brake', 'wagon'],
  ['quadricycle', 'hatchback'],
])

const TRIM_KEYWORDS = [
  ['long range', 42],
  ['performance', 34],
  ['premium', 30],
  ['quattro', 28],
  ['xdrive', 28],
  ['all4', 28],
  ['all-wheel drive', 28],
  ['awd', 28],
  ['dual motor', 26],
  ['pro', 20],
  ['plus', 18],
  ['extended range', 18],
  ['grand touring', 18],
  ['touring', 12],
  ['standard', 10],
  ['base', 6],
]

const warnedBodyMappings = new Set()
const notableSkips = []
const notedSkipKeys = new Set()

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function compact(value) {
  return normalize(value).replace(/\s+/g, '')
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function round(value, places = 0) {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

function inBounds(value, [min, max]) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function camelCase(value) {
  return value.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())
}

function makeAliases(makes) {
  const aliases = new Set(makes.map(normalize))
  if (aliases.has('skoda')) aliases.add('skoda')
  if (aliases.has('citroen')) aliases.add('citroen')
  if (aliases.has('mg')) aliases.add('mg motor')
  return aliases
}

function parseCsvLine(line) {
  const cells = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      cells.push(cell)
      cell = ''
    } else {
      cell += char
    }
  }

  cells.push(cell)
  return cells
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  const headers = parseCsvLine(lines[0])
  const rows = []

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line)
    const row = {}
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? ''
    })
    rows.push(row)
  }

  return rows
}

function buildEpaIndex(rows) {
  const byYearMake = new Map()

  for (const row of rows) {
    const year = Number(row.year)
    const range = Number(row.range)
    if (!Number.isFinite(year) || !Number.isFinite(range) || range <= 0) continue
    if (!String(row.fuelType ?? '').includes('Electric') && row.atvType !== 'EV') continue

    const make = normalize(row.make)
    const key = `${year}|${make}`
    const entries = byYearMake.get(key) ?? []
    entries.push({
      model: row.model,
      baseModel: row.baseModel,
      modelNorm: normalize(row.model),
      baseModelNorm: normalize(row.baseModel),
      range,
    })
    byYearMake.set(key, entries)
  }

  return byYearMake
}

function findEpaRange(epaIndex, vehicle) {
  const make = normalize(vehicle.make?.name)
  const model = normalize(vehicle.model?.name)
  const entries = epaIndex.get(`${vehicle.year}|${make}`) ?? []
  const matches = entries.filter((entry) => {
    if (entry.baseModelNorm === model || entry.modelNorm === model) return true
    return entry.modelNorm.includes(model) || model.includes(entry.baseModelNorm)
  })

  if (matches.length === 0) return null

  matches.sort((left, right) => {
    const score = (entry) => {
      let total = 0
      if (entry.modelNorm === model) total += 100
      if (entry.baseModelNorm === model) total += 80
      if (entry.modelNorm.startsWith(model)) total += 25
      total -= Math.abs(entry.modelNorm.length - model.length) / 10
      total += entry.range / 1000
      return total
    }
    return score(right) - score(left)
  })

  return Math.round(matches[0].range)
}

function getOpenEvRange(vehicle) {
  const rated = vehicle.range?.rated ?? []
  const byCycle = (cycle) => rated.find((entry) => normalize(entry.cycle) === cycle && Number(entry.range_km) > 0)
  const epa = byCycle('epa')
  if (epa) return { rangeMi: Math.round(Number(epa.range_km) * 0.621371), rangeSource: 'EPA' }

  const wltp = byCycle('wltp')
  if (wltp) return { rangeMi: Math.round(Number(wltp.range_km) * 0.621371 * 0.89), rangeSource: 'WLTP-converted' }

  const cltc = byCycle('cltc')
  if (cltc) return { rangeMi: Math.round(Number(cltc.range_km) * 0.621371 * 0.75), rangeSource: 'WLTP-converted' }

  return null
}

function getRange(vehicle, epaIndex) {
  const epaRange = findEpaRange(epaIndex, vehicle)
  if (epaRange) return { rangeMi: epaRange, rangeSource: 'EPA', epaMatched: true }

  const fallback = getOpenEvRange(vehicle)
  if (!fallback) return null
  return { ...fallback, epaMatched: false }
}

function mapBodyStyle(rawStyle) {
  const raw = String(rawStyle ?? '').trim()
  const mapped = BODY_STYLE_MAP.get(raw) ?? BODY_STYLE_MAP.get(normalize(raw))
  if (!mapped) return null
  if (mapped !== raw && !warnedBodyMappings.has(raw)) {
    warnedBodyMappings.add(raw)
    console.log(`warning: mapped body.style "${raw}" to "${mapped}"`)
  }
  return mapped
}

function getVariant(vehicle) {
  const trim = vehicle.trim?.name
  const variant = vehicle.variant?.name
  if (trim && normalize(trim) !== 'base') return trim
  if (variant) return variant
  return trim || 'Standard'
}

function getPriceUsd(vehicle) {
  const prices = vehicle.pricing?.msrp ?? []
  const usd = prices.find((price) => price.currency === 'USD' && Number(price.amount) > 0)
  return usd ? Number(usd.amount) : null
}

function mapDrivetrain(value) {
  const normalized = normalize(value)
  if (normalized === 'awd' || normalized.includes('all wheel')) return 'AWD'
  if (normalized === 'rwd' || normalized.includes('rear wheel')) return 'RWD'
  if (normalized === 'fwd' || normalized.includes('front wheel')) return 'FWD'
  return null
}

function rememberSkip(vehicle, reason) {
  const make = vehicle.make?.name ?? 'Unknown make'
  const model = vehicle.model?.name ?? 'Unknown model'
  const year = vehicle.year ?? 'unknown year'
  const variant = getVariant(vehicle)
  const key = `${make}|${model}|${variant}|${year}|${reason}`
  if (notedSkipKeys.has(key)) return
  notedSkipKeys.add(key)

  const message = `${make} ${model} ${variant} ${year}: ${reason}`

  if (notableSkips.length < 20) {
    console.log(`warning: skip ${message}`)
  }
  if (notableSkips.length >= 40) return
  notableSkips.push(message)
}

function reject(vehicle, reason) {
  rememberSkip(vehicle, reason)
  return null
}

function transformVehicle(vehicle, epaIndex) {
  const make = vehicle.make?.name
  const model = vehicle.model?.name
  const variant = getVariant(vehicle)
  const year = Number(vehicle.year)

  if (!make || !model || !variant) return reject(vehicle, 'missing make/model/variant')
  if (!inBounds(year, BOUNDS.year)) return reject(vehicle, `year ${year} outside ${BOUNDS.year.join('-')}`)

  const bodyStyle = mapBodyStyle(vehicle.body?.style)
  if (!bodyStyle) return reject(vehicle, `unmapped body style "${vehicle.body?.style ?? 'missing'}"`)

  const range = getRange(vehicle, epaIndex)
  if (!range) return reject(vehicle, 'missing EPA/WLTP/CLTC range')
  if (!inBounds(range.rangeMi, BOUNDS.rangeMi)) return reject(vehicle, `rangeMi ${range.rangeMi} outside schema bounds`)

  const batteryGrossKwh = Number(vehicle.battery?.pack_capacity_kwh_gross)
  if (!inBounds(batteryGrossKwh, BOUNDS.batteryGrossKwh)) {
    return reject(vehicle, `batteryGrossKwh ${batteryGrossKwh || 'missing'} outside schema bounds`)
  }

  const net = vehicle.battery?.pack_capacity_kwh_net
  const batteryNetKwh = net == null ? null : Number(net)
  if (batteryNetKwh !== null && !inBounds(batteryNetKwh, BOUNDS.batteryNetKwh)) {
    return reject(vehicle, `batteryNetKwh ${batteryNetKwh} outside schema bounds`)
  }

  const maxDcChargeKw = Number(vehicle.charging?.dc?.max_power_kw)
  if (!inBounds(maxDcChargeKw, BOUNDS.maxDcChargeKw)) {
    return reject(vehicle, `maxDcChargeKw ${maxDcChargeKw || 'missing'} outside schema bounds`)
  }

  const zeroToSixtySec = round(Number(vehicle.performance?.acceleration_0_100_kmh_s) * 0.96, 1)
  if (!inBounds(zeroToSixtySec, BOUNDS.zeroToSixtySec)) {
    return reject(vehicle, `zeroToSixtySec ${zeroToSixtySec || 'missing'} outside schema bounds`)
  }

  const topSpeedMph = Math.round(Number(vehicle.performance?.top_speed_kmh) * 0.621371)
  if (!inBounds(topSpeedMph, BOUNDS.topSpeedMph)) {
    return reject(vehicle, `topSpeedMph ${topSpeedMph || 'missing'} outside schema bounds`)
  }

  const powerKw = Number(vehicle.powertrain?.system_power_kw)
  if (!inBounds(powerKw, BOUNDS.powerKw)) return reject(vehicle, `powerKw ${powerKw || 'missing'} outside schema bounds`)

  const powerHp = Math.round(powerKw * 1.34102)
  if (!inBounds(powerHp, BOUNDS.powerHp)) return reject(vehicle, `powerHp ${powerHp} outside schema bounds`)

  const torqueLbFt = Math.round(Number(vehicle.powertrain?.system_torque_nm) * 0.73756)
  if (!inBounds(torqueLbFt, BOUNDS.torqueLbFt)) {
    return reject(vehicle, `torqueLbFt ${torqueLbFt || 'missing'} outside schema bounds`)
  }

  const drivetrain = mapDrivetrain(vehicle.powertrain?.drivetrain)
  if (!drivetrain) return reject(vehicle, `unmapped drivetrain "${vehicle.powertrain?.drivetrain ?? 'missing'}"`)

  const efficiencyWhPerMi = Math.round(((batteryNetKwh ?? batteryGrossKwh) * 1000) / range.rangeMi)
  if (!inBounds(efficiencyWhPerMi, BOUNDS.efficiencyWhPerMi)) {
    return reject(vehicle, `efficiencyWhPerMi ${efficiencyWhPerMi} outside 180-600`)
  }

  const seats = Number(vehicle.body?.seats ?? 5)
  if (!Number.isInteger(seats) || !inBounds(seats, BOUNDS.seats)) {
    return reject(vehicle, `seats ${seats || 'missing'} outside schema bounds`)
  }

  const id = slugify(`${make}-${model}-${variant}-${year}`)
  const sourceUrl = vehicle.sources?.find((source) => source.url)?.url ?? null

  return {
    id,
    make,
    model,
    variant,
    year,
    bodyStyle,
    priceUsd: getPriceUsd(vehicle),
    rangeMi: range.rangeMi,
    rangeSource: range.rangeSource,
    batteryGrossKwh,
    batteryNetKwh,
    maxDcChargeKw,
    zeroToSixtySec,
    topSpeedMph,
    powerHp,
    powerKw,
    torqueLbFt,
    drivetrain,
    efficiencyWhPerMi,
    seats,
    cargoCuFt: null,
    imageUrl: null,
    imageAttribution: null,
    accentColor: null,
    provenance: {
      openevId: vehicle.unique_code ?? id,
      sources: sourceUrl ? [sourceUrl] : [],
      epaMatched: range.epaMatched,
    },
    _score: scoreVehicle(vehicle, {
      rangeSource: range.rangeSource,
      epaMatched: range.epaMatched,
      bodyStyle,
      variant,
      priceUsd: getPriceUsd(vehicle),
    }),
    _modelKey: `${normalize(make)}|${normalize(model)}`,
    _makeKey: normalize(make),
    _variantYearKey: `${normalize(model)}|${normalize(variant)}|${year}`,
  }
}

function scoreVehicle(vehicle, meta) {
  const variant = normalize(meta.variant)
  let score = Number(vehicle.year) * 100
  if ((vehicle.markets ?? []).some((market) => normalize(market) === 'us')) score += 500
  if (meta.epaMatched) score += 350
  if (meta.rangeSource === 'EPA') score += 250
  if (meta.priceUsd !== null) score += 70

  for (const [keyword, value] of TRIM_KEYWORDS) {
    if (variant.includes(keyword)) score += value
  }

  if (meta.bodyStyle === 'truck' || meta.bodyStyle === 'wagon' || meta.bodyStyle === 'van') score += 20
  if (normalize(vehicle.availability?.status) === 'production') score += 15
  return score
}

function readTeslaFixtureCombos(text) {
  const combos = new Set()
  const blocks = text.split(/\n\s*\},\n/)

  for (const block of blocks) {
    const model = block.match(/model:\s*'([^']+)'/)?.[1]
    const variant = block.match(/variant:\s*'([^']+)'/)?.[1]
    const year = block.match(/year:\s*(\d{4})/)?.[1]
    if (!variant || !year) continue
    combos.add(`${normalize(variant)}|${year}`)
    if (model) combos.add(`${normalize(model)}|${normalize(variant)}|${year}`)
  }

  return combos
}

function selectGroupCars(group, allCandidates, teslaFixtureCombos) {
  const allowedMakes = makeAliases(group.makes)
  const candidates = allCandidates
    .filter((car) => allowedMakes.has(normalize(car.make)))
    .filter((car) => {
      if (group.key !== 'tesla') return true
      return !teslaFixtureCombos.has(`${normalize(car.variant)}|${car.year}`) &&
        !teslaFixtureCombos.has(`${normalize(car.model)}|${normalize(car.variant)}|${car.year}`)
    })
    .sort((left, right) => right._score - left._score || left.id.localeCompare(right.id))

  const selected = []
  const usedIds = new Set()
  const usedModels = new Set()
  const usedMakes = new Set()
  const bodyCounts = new Map()

  const tryAdd = (car) => {
    if (selected.length >= group.count || usedIds.has(car.id)) return false
    selected.push(car)
    usedIds.add(car.id)
    usedModels.add(car._modelKey)
    usedMakes.add(car._makeKey)
    bodyCounts.set(car.bodyStyle, (bodyCounts.get(car.bodyStyle) ?? 0) + 1)
    return true
  }

  for (const make of [...new Set(candidates.map((car) => car._makeKey))]) {
    const best = candidates.find((car) => car._makeKey === make && !usedIds.has(car.id))
    if (best) tryAdd(best)
  }

  for (const car of candidates) {
    if (!usedModels.has(car._modelKey)) tryAdd(car)
  }

  const bodyDiverse = [...candidates].sort((left, right) => {
    const leftBodyCount = bodyCounts.get(left.bodyStyle) ?? 0
    const rightBodyCount = bodyCounts.get(right.bodyStyle) ?? 0
    return leftBodyCount - rightBodyCount || right._score - left._score
  })
  for (const car of bodyDiverse) tryAdd(car)

  for (const car of candidates) tryAdd(car)

  if (selected.length !== group.count) {
    throw new Error(`${group.key}: selected ${selected.length}, expected ${group.count}`)
  }

  return selected.map(({ _score, _modelKey, _makeKey, _variantYearKey, ...car }) => car)
}

function assertSelected(groups) {
  const cars = groups.flatMap((group) => group.cars)
  if (cars.length !== 95) throw new Error(`Total selected cars ${cars.length} !== 95`)

  for (const car of cars) {
    if (!inBounds(car.rangeMi, BOUNDS.rangeMi)) throw new Error(`${car.id}: rangeMi out of bounds`)
    if (!inBounds(car.zeroToSixtySec, BOUNDS.zeroToSixtySec)) throw new Error(`${car.id}: zeroToSixtySec out of bounds`)
    if (!inBounds(car.maxDcChargeKw, BOUNDS.maxDcChargeKw)) throw new Error(`${car.id}: maxDcChargeKw out of bounds`)
    if (!inBounds(car.efficiencyWhPerMi, BOUNDS.efficiencyWhPerMi)) throw new Error(`${car.id}: efficiencyWhPerMi out of bounds`)
    if (!inBounds(car.batteryGrossKwh, BOUNDS.batteryGrossKwh)) throw new Error(`${car.id}: batteryGrossKwh missing/out of bounds`)
    if (!['AWD', 'RWD', 'FWD'].includes(car.drivetrain)) throw new Error(`${car.id}: invalid drivetrain`)
  }
}

async function main() {
  const [openEvText, epaText, teslaFixtureText] = await Promise.all([
    readFile(OPENE_EV_PATH, 'utf8'),
    readFile(EPA_PATH, 'utf8'),
    readFile(TESLA_FIXTURE_PATH, 'utf8'),
  ])

  const openEvData = JSON.parse(openEvText)
  const vehicles = openEvData.vehicles ?? []
  const epaIndex = buildEpaIndex(parseCsv(epaText))
  const teslaFixtureCombos = readTeslaFixtureCombos(teslaFixtureText)
  const selectedMakeAliases = new Set(GROUPS.flatMap((group) => [...makeAliases(group.makes)]))
  const allCandidates = []

  for (const vehicle of vehicles) {
    if (!selectedMakeAliases.has(normalize(vehicle.make?.name))) continue
    const car = transformVehicle(vehicle, epaIndex)
    if (car) allCandidates.push(car)
  }

  const outputs = GROUPS.map((group) => ({
    group: group.key,
    targetExportName: camelCase(group.key),
    cars: selectGroupCars(group, allCandidates, teslaFixtureCombos),
  }))

  assertSelected(outputs)

  await mkdir(OUT_DIR, { recursive: true })
  for (const output of outputs) {
    const outPath = path.join(OUT_DIR, `${output.group}.seed.json`)
    await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`)
  }

  console.log('\ngroup | count | makes represented')
  console.log('--- | ---: | ---')
  for (const output of outputs) {
    const makes = [...new Set(output.cars.map((car) => car.make))].sort().join(', ')
    console.log(`${output.group} | ${output.cars.length} | ${makes}`)
  }

  const cars = outputs.flatMap((output) => output.cars)
  console.log(`\nEPA-joined ranges: ${cars.filter((car) => car.provenance.epaMatched).length}`)
  console.log(`Cars with priceUsd: ${cars.filter((car) => car.priceUsd !== null).length}`)
  console.log('\nNotable skips:')
  for (const skip of notableSkips.slice(0, 20)) {
    console.log(`- ${skip}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
