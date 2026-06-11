import { z } from 'zod'

export const BodyStyle = z.enum(['sedan', 'suv', 'crossover', 'hatchback', 'coupe', 'truck', 'van', 'wagon'])
export const Drivetrain = z.enum(['RWD', 'AWD', 'FWD'])
export const RangeSource = z.enum(['EPA', 'WLTP-converted', 'manufacturer-est'])

export const CarSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  make: z.string().min(1),
  model: z.string().min(1),
  variant: z.string().min(1),
  year: z.number().int().min(2020).max(2026),
  bodyStyle: BodyStyle,
  priceUsd: z.number().min(15_000).max(350_000),
  rangeMi: z.number().min(80).max(600),
  rangeSource: RangeSource,
  batteryGrossKwh: z.number().min(20).max(250),
  batteryNetKwh: z.number().min(15).max(250).nullable(),
  maxDcChargeKw: z.number().min(40).max(500),
  zeroToSixtySec: z.number().min(1.5).max(12),
  topSpeedMph: z.number().min(80).max(220),
  powerHp: z.number().min(80).max(1300),
  powerKw: z.number().min(60).max(1000),
  torqueLbFt: z.number().min(100).max(1200),
  drivetrain: Drivetrain,
  efficiencyWhPerMi: z.number().min(180).max(600),
  seats: z.number().int().min(2).max(8),
  cargoCuFt: z.number().positive().nullable(),
  imageUrl: z
    .string()
    .url()
    .refine((value) => value.startsWith('https://upload.wikimedia.org/')),
  imageAttribution: z.string().min(1),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export type Car = z.infer<typeof CarSchema>

export const CAR_SORT_KEYS = ['price', 'range', 'efficiency', 'zeroToSixty', 'name'] as const

export type SortKey = (typeof CAR_SORT_KEYS)[number]
export type SortDir = 'asc' | 'desc'
