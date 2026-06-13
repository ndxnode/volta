// Usage: node scripts/check-images.mjs [cars.json]
// Fetches http://localhost:3000/api/cars if reachable, else reads JSON dump from argv[2];
// for each car HEAD-requests imageUrl, prints failures, exits 1 if any fail.

import { readFile } from 'node:fs/promises'

const LOCAL_CARS_URL = 'http://localhost:3000/api/cars'

// Wikimedia requires a descriptive User-Agent and rate-limits bursts (429).
// Throttle politely and retry a 429 once after a pause so this is a reliable gate.
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function headOnce(url) {
  return fetch(url, { method: 'HEAD', redirect: 'follow', headers: HEADERS })
}

async function main() {
  const cars = await loadCars()
  const failures = []

  for (const car of cars) {
    if (!car.imageUrl) {
      console.log(`SKIP ${car.id} (no image — designed fallback)`)
      continue
    }

    try {
      let response = await headOnce(car.imageUrl)

      if (response.status === 429) {
        await sleep(3000)
        response = await headOnce(car.imageUrl)
      }

      const status = response.status

      console.log(`${status} ${car.id} ${car.imageUrl}`)

      if (!response.ok) {
        failures.push(`${status} ${car.id} ${car.imageUrl}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const failure = `ERR ${car.id} ${car.imageUrl} ${message}`

      console.error(failure)
      failures.push(failure)
    }

    await sleep(120)
  }

  if (failures.length) {
    console.error(`\n${failures.length} image request(s) failed:`)
    for (const failure of failures) console.error(failure)
    process.exit(1)
  }
}

async function loadCars() {
  const fromServer = await fetchCarsFromServer()

  if (fromServer) return fromServer

  const dumpPath = process.argv[2]

  if (!dumpPath) {
    throw new Error('No local API response and no JSON dump path provided.')
  }

  return normalizeCars(JSON.parse(await readFile(dumpPath, 'utf8')))
}

async function fetchCarsFromServer() {
  try {
    const response = await fetch(LOCAL_CARS_URL)

    if (!response.ok) return null

    return normalizeCars(await response.json())
  } catch {
    return null
  }
}

function normalizeCars(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.cars)) return payload.cars

  throw new Error('Expected a car array or an object with a cars array.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
