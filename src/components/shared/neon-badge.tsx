import * as React from 'react'
import { cn } from '@/lib/utils'

type NeonBadgeVariant = 'cyan' | 'violet' | 'muted'

interface NeonBadgeProps extends React.ComponentProps<'span'> {
  variant?: NeonBadgeVariant
}

const VARIANT_CLASSES: Record<NeonBadgeVariant, string> = {
  cyan: 'border-primary/35 bg-primary/10 text-primary',
  violet:
    'border-[color:var(--neon-violet)]/35 bg-[color:var(--neon-violet)]/10 text-[color:var(--neon-violet)]',
  muted: 'border-border bg-muted/50 text-muted-foreground',
}

/**
 * Small chip for drivetrain / body-style metadata.
 * Uppercase mono, tight tracking — reads like a HUD label.
 */
export function NeonBadge({
  variant = 'muted',
  className,
  children,
  ...props
}: NeonBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-xs uppercase tracking-wider',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
