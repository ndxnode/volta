import { GitCompareArrows } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { toast } from 'sonner'

import type { Car } from '@/lib/car-schema'
import {
  formatEfficiency,
  formatPower,
  formatPrice,
  formatRange,
  formatZeroToSixty,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCompare } from '@/hooks/use-compare'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { CarImage } from '@/components/shared/car-image'
import { FavoriteButton } from '@/components/shared/favorite-button'
import { NeonBadge } from '@/components/shared/neon-badge'
import { Button } from '@/components/ui/button'

import { StatBar } from './stat-bar'

// Dataset bounds (see car-schema): range 80–600 mi, power 80–1300 hp,
// efficiency 180–600 Wh/mi. Efficiency is inverted so lower = fuller bar.
const RANGE_MAX = 600
const POWER_MAX = 1300
const EFF_MIN = 180
const EFF_MAX = 600

/**
 * The detail-page hero: a brand-accent radial backwash (the one glow for this
 * region) behind a large car image, with the name overlay, headline badges,
 * favorite + compare actions, and three visceral stat bars.
 */
export function CarHero({ car }: { car: Car }) {
  const prefersReduced = useReducedMotion()
  const { has, toggle, max } = useCompare()
  const comparing = has(car.id)

  const label = `${car.year} ${car.make} ${car.model} ${car.variant}`
  const accent = car.accentColor

  function handleCompare() {
    const ok = toggle(car.id)
    if (!ok) {
      toast.warning(`The compare tray is full at ${max} cars.`, {
        description: 'Remove one to add another.',
      })
    }
  }

  return (
    <motion.section
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="grid gap-8 lg:grid-cols-2 lg:items-center"
    >
      {/* Image with the single accent radial backwash for this region */}
      <div
        className="relative overflow-hidden rounded-[var(--radius)] border border-border"
        style={{
          backgroundImage: `radial-gradient(120% 110% at 50% 6%, color-mix(in oklch, ${accent} 32%, transparent) 0%, transparent 60%)`,
        }}
      >
        <CarImage
          src={car.imageUrl ?? undefined}
          alt={label}
          accentColor={accent}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[16/10] w-full"
        />
      </div>

      {/* Identity + actions + headline stats */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <NeonBadge variant="cyan">{car.drivetrain}</NeonBadge>
            <NeonBadge variant="violet">{car.bodyStyle}</NeonBadge>
            <NeonBadge variant="muted">{car.rangeSource}</NeonBadge>
          </div>

          <div>
            <p className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
              {car.year} · {car.make}
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {car.model}{' '}
              <span className="text-muted-foreground">{car.variant}</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={comparing ? 'secondary' : 'outline'}
              onClick={handleCompare}
              aria-pressed={comparing}
            >
              <GitCompareArrows aria-hidden />
              {comparing ? 'In compare' : 'Add to compare'}
            </Button>
            <FavoriteButton carId={car.id} carLabel={`${car.make} ${car.model}`} />
            <span className="ml-auto font-mono text-lg font-medium tabular-nums text-foreground">
              <AnimatedNumber value={car.priceUsd} format={formatPrice} />
            </span>
          </div>
        </div>

        {/* Headline figures */}
        <div className="grid grid-cols-3 gap-3">
          <HeadlineFigure
            label="Range"
            value={car.rangeMi}
            format={(n) => formatRange(n)}
          />
          <HeadlineFigure
            label="Power"
            value={car.powerHp}
            format={(n) => formatPower(n)}
          />
          <HeadlineFigure
            label="0–60"
            value={car.zeroToSixtySec}
            format={(n) => formatZeroToSixty(n)}
            durationMs={500}
          />
        </div>

        {/* Visceral bars */}
        <div className="space-y-4">
          <StatBar
            label="Range"
            value={formatRange(car.rangeMi)}
            fraction={car.rangeMi / RANGE_MAX}
            accentColor={accent}
          />
          <StatBar
            label="Power"
            value={formatPower(car.powerHp)}
            fraction={car.powerHp / POWER_MAX}
            accentColor={accent}
          />
          <StatBar
            label="Efficiency"
            value={formatEfficiency(car.efficiencyWhPerMi)}
            // Inverted: lower Wh/mi is better, so it fills more.
            fraction={(EFF_MAX - car.efficiencyWhPerMi) / (EFF_MAX - EFF_MIN)}
            accentColor={accent}
          />
        </div>
      </div>
    </motion.section>
  )
}

function HeadlineFigure({
  label,
  value,
  format,
  durationMs,
  className,
}: {
  label: string
  value: number
  format: (n: number) => string
  durationMs?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-border bg-card/50 px-3 py-2.5',
        className,
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <AnimatedNumber
        value={value}
        format={format}
        durationMs={durationMs}
        className="mt-0.5 block text-lg font-medium tabular-nums text-foreground"
      />
    </div>
  )
}
