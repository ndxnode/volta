import * as React from 'react'

import type { Car } from '@/lib/car-schema'
import { connectorNote, estimateDcFastChargeMinutes, formatChargeWindow } from '@/lib/charge-time'
import {
  estimateAnnualEnergyCost,
  estimateCostPerMile,
  formatAnnualCost,
  formatCostPerMile,
} from '@/lib/running-cost'
import {
  formatBattery,
  formatEfficiency,
  formatPower,
  formatPrice,
  formatRange,
  formatZeroToSixty,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/shared/glass-card'

const DASH = '—'

interface SpecRow {
  label: string
  value: React.ReactNode
}

interface SpecSection {
  title: string
  rows: SpecRow[]
}

const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

function buildSections(car: Car): SpecSection[] {
  return [
    {
      title: 'Performance',
      rows: [
        { label: 'Power', value: formatPower(car.powerHp) },
        { label: 'Power (kW)', value: `${integer.format(car.powerKw)} kW` },
        { label: 'Torque', value: `${integer.format(car.torqueLbFt)} lb-ft` },
        { label: '0–60 mph', value: formatZeroToSixty(car.zeroToSixtySec) },
        { label: 'Top speed', value: `${integer.format(car.topSpeedMph)} mph` },
      ],
    },
    {
      title: 'Range & Battery',
      rows: [
        { label: 'Range', value: `${formatRange(car.rangeMi)} · ${car.rangeSource}` },
        { label: 'Battery (gross)', value: formatBattery(car.batteryGrossKwh) },
        {
          label: 'Battery (net)',
          value: car.batteryNetKwh == null ? DASH : formatBattery(car.batteryNetKwh),
        },
        { label: 'DC charge', value: `${integer.format(car.maxDcChargeKw)} kW` },
        { label: '10–80% DC', value: formatChargeWindow(estimateDcFastChargeMinutes(car)) },
        { label: 'Connector', value: connectorNote(car) },
        { label: 'Efficiency', value: formatEfficiency(car.efficiencyWhPerMi) },
        { label: 'Cost / yr', value: formatAnnualCost(estimateAnnualEnergyCost(car)) },
        { label: 'Cost / mi', value: formatCostPerMile(estimateCostPerMile(car)) },
      ],
    },
    {
      title: 'Practical',
      rows: [
        { label: 'Seats', value: integer.format(car.seats) },
        {
          label: 'Cargo',
          value: car.cargoCuFt == null ? DASH : `${integer.format(car.cargoCuFt)} cu ft`,
        },
        { label: 'Body style', value: <span className="capitalize">{car.bodyStyle}</span> },
        { label: 'Drivetrain', value: car.drivetrain },
        { label: 'Price', value: formatPrice(car.priceUsd) },
      ],
    },
  ]
}

/**
 * Full spec sheet grouped into Performance / Range & Battery / Practical.
 * Labels are muted uppercase mono; values are mono tabular. Nulls render a dash.
 */
export function SpecGrid({ car, className }: { car: Car; className?: string }) {
  const sections = buildSections(car)

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {sections.map((section) => (
        <GlassCard key={section.title} className="p-5">
          <h3 className="font-display text-sm font-medium tracking-tight text-foreground">
            {section.title}
          </h3>
          <dl className="mt-4 space-y-3">
            {section.rows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"
              >
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="text-right font-mono text-sm tabular-nums text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </GlassCard>
      ))}
    </div>
  )
}
