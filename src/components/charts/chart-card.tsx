import * as React from 'react'
import { GlassCard } from '@/components/shared/glass-card'
import { cn } from '@/lib/utils'

interface ChartCardProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Fixed pixel height for the chart body — keeps SSR fallback + chart aligned. */
  bodyHeight?: number
  children: React.ReactNode
}

/**
 * Glass panel scaffold for a single chart: titled header + a fixed-height body.
 * The fixed height lets the ClientOnly skeleton fallback occupy the exact same
 * footprint as the Recharts canvas, so hydration never shifts layout.
 */
export function ChartCard({
  title,
  subtitle,
  bodyHeight = 320,
  className,
  children,
  ...props
}: ChartCardProps) {
  return (
    <GlassCard className={cn('flex flex-col p-5 sm:p-6', className)} {...props}>
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm text-muted-foreground text-pretty">{subtitle}</p>
        ) : null}
      </div>
      <div className="mt-5" style={{ height: bodyHeight }}>
        {children}
      </div>
    </GlassCard>
  )
}
