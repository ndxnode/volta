import * as React from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends React.ComponentProps<'div'> {
  /** Adds a faint cyan border-glow for emphasis (use with discipline). */
  glow?: boolean
  /** Adds hover lift + border brighten (CSS only, gated to fine pointers). */
  interactive?: boolean
}

/**
 * Core surface primitive for VOLTA: a frosted glass panel.
 * Pairs the `glass` utility with the design-system radius and optional
 * glow / interactive affordances.
 */
export function GlassCard({
  glow = false,
  interactive = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass rounded-[var(--radius)]',
        glow &&
          'border-primary/30 shadow-[0_0_0_1px_color-mix(in_oklch,var(--neon)_20%,transparent),0_0_24px_-6px_color-mix(in_oklch,var(--neon)_40%,transparent)]',
        interactive &&
          'transition-[transform,border-color,box-shadow] duration-300 ease-out [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-primary/40',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
