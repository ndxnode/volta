// Usage: node scripts/check-images.mjs [cars.json]
// Fetches http://localhost:3000/api/cars if reachable, else reads JSON dump from argv[2];
// for each car HEAD-requests imageUrl, prints failures, exits 1 if any fail.

import { readFile } from 'node:fs/promises'

const LOCAL_CARS_URL = 'http://localhost:3000/api/cars'

async function main() {
  const cars = await loadCars()
  const failures = []

  for (const car of cars) {
    try {
      const response = await fetch(car.imageUrl, { method: 'HEAD', redirect: 'follow' })
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
