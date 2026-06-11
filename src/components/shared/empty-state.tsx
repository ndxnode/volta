import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from './glass-card'

interface EmptyStateProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  icon?: LucideIcon
  title: React.ReactNode
  hint?: React.ReactNode
  /** Optional action (e.g. a button) rendered below the hint. */
  action?: React.ReactNode
}

/**
 * Centered glass panel for empty / zero-result / fallback states.
 */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <GlassCard
      className={cn(
        'flex flex-col items-center gap-4 px-8 py-14 text-center',
        className,
      )}
      {...props}
    >
      {Icon ? (
        <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground">
          <Icon className="size-6" aria-hidden />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-medium text-foreground">
          {title}
        </h2>
        {hint ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground text-pretty">
            {hint}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </GlassCard>
  )
}
