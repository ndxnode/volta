const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const integer = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const decimal = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatPrice(usdValue: number): string {
  return usd.format(usdValue)
}

export function formatRange(mi: number): string {
  return `${integer.format(mi)} mi`
}

export function formatPower(hp: number): string {
  return `${integer.format(hp)} hp`
}

export function formatBattery(kwh: number): string {
  return `${integer.format(kwh)} kWh`
}

export function formatZeroToSixty(sec: number): string {
  return `${decimal.format(sec)}s`
}

export function formatEfficiency(whPerMi: number): string {
  return `${integer.format(whPerMi)} Wh/mi`
}
