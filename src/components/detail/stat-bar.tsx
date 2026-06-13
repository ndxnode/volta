import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'

import { cn } from '@/lib/utils'

interface StatBarProps {
  /** Short uppercase label, e.g. "Range". */
  label: React.ReactNode
  /** Formatted value rendered at the trailing edge of the row. */
  value: React.ReactNode
  /** Fill fraction in 0..1. Clamped. Higher = fuller. */
  fraction: number
  /** Accent for the fill. Defaults to cyan (the one interactive accent). */
  accentColor?: string
  className?: string
}

/**
 * A labeled horizontal meter that fills to `fraction`. The fill animates
 * scaleX from 0 with an ease-out curve; under reduced motion it renders
 * the final width immediately. Used to make range / power / efficiency feel
 * visceral inside the hero and spec grid.
 */
export function StatBar({
  label,
  value,
  fraction,
  accentColor = 'var(--neon)',
  className,
}: StatBarProps) {
  const prefersReduced = useReducedMotion()
  const clamped = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0))

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-sm tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
        <motion.div
          className="h-full origin-left rounded-full"
          style={{
            backgroundImage: `linear-gradient(90deg, color-mix(in oklch, ${accentColor} 55%, transparent), ${accentColor})`,
            width: `${clamped * 100}%`,
          }}
          initial={prefersReduced ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
