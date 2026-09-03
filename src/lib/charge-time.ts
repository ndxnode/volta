import type { Car } from '@/lib/car-schema'

/**
 * Fraction of usable pack energy added across a 10% → 80% DC fast-charge session.
 * Real-world DC charging tapers in the upper SoC band, so the published peak
 * `maxDcChargeKw` is only sustained briefly. We model the whole 10→80% window
 * with a single *average*-power derate instead of assuming constant peak power.
 */
export const SOC_WINDOW_FRACTION = 0.7

/**
 * Average-power derate applied to a car's peak DC charge rate. Across a 10→80%
 * session the delivered power is well below the headline peak (taper, thermal
 * limits, BMS ramp). 0.65 is a deliberately middle-of-the-road assumption in the
 * commonly-cited ~0.62–0.70 band; it is a heuristic, not a per-car measurement.
 */
export const AVG_POWER_DERATE = 0.65

/**
 * Estimate the minutes to DC fast-charge from 10% → 80% state of charge.
 *
 * energy added = SOC_WINDOW_FRACTION * batteryGrossKwh (kWh)
 * effective power = AVG_POWER_DERATE * maxDcChargeKw (kW)
 * minutes = energy / power * 60, rounded to the nearest integer.
 *
 * Pure: no DOM / React / chart imports. Returns an integer.
 */
export function estimateDcFastChargeMinutes(
  car: Pick<Car, 'batteryGrossKwh' | 'maxDcChargeKw'>,
): number {
  const energyKwh = SOC_WINDOW_FRACTION * car.batteryGrossKwh
  const effectivePowerKw = AVG_POWER_DERATE * car.maxDcChargeKw
  return Math.round((energyKwh / effectivePowerKw) * 60)
}

/** Format an estimated charge window as a short approximate label, e.g. `~27 min`. */
export function formatChargeWindow(minutes: number): string {
  return `~${minutes} min`
}

/**
 * Connector / charging-network note for a car.
 *
 * YOUR TURN (user, ~5-10 lines): branch on `car.make` / `car.year` to return a
 * per-car connector note instead of this single generic fallback. Rough rules:
 *   - Tesla (any year)            -> 'NACS (Tesla)'
 *   - Recent US-market models     -> 'NACS — native or CCS1 + adapter'
 *     (2025+ adoption is rolling out; many older US cars are still CCS1)
 *   - Otherwise US/older          -> 'CCS1'
 *   - EU-market cars              -> 'CCS2'
 * Keep it a pure string return so it stays unit-testable. The generic fallback
 * below keeps the build green until you wire the real logic.
 */
export function connectorNote(_car: Car): string {
  return 'CCS / NACS adapter — check manufacturer'
}
