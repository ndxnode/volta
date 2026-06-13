import { CarSchema, type Car } from '../../lib/car-schema'
import { tesla } from './tesla'
import { hyundaiKiaGenesis } from './hyundai-kia-genesis'
import { bmwMini } from './bmw-mini'
import { mercedesSmart } from './mercedes-smart'
import { audiPorsche } from './audi-porsche'
import { vwGroup } from './vw-group'
import { fordGm } from './ford-gm'
import { startups } from './startups'
import { japan } from './japan'
import { chinaEurope } from './china-europe'

const all = [
  ...tesla,
  ...hyundaiKiaGenesis,
  ...bmwMini,
  ...mercedesSmart,
  ...audiPorsche,
  ...vwGroup,
  ...fordGm,
  ...startups,
  ...japan,
  ...chinaEurope,
]
const ids = new Set<string>()

for (const car of all) {
  if (ids.has(car.id)) {
    throw new Error(`Duplicate car id: ${car.id}`)
  }

  ids.add(car.id)
}

export const cars: Car[] = CarSchema.array().parse(all)
export const allMakes = [...new Set(cars.map((car) => car.make))].sort()
