import * as React from 'react'
import { cn } from '@/lib/utils'
import { GradientText } from './gradient-text'

interface PageHeaderProps extends Omit<React.ComponentProps<'header'>, 'title'> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Wraps the title in a cyan->violet GradientText. */
  gradient?: boolean
  /** Optional trailing slot (filters, actions) rendered to the right on wide screens. */
  actions?: React.ReactNode
}

/**
 * Consistent page title block: display-font h1 + optional subtitle.
 */
export function PageHeader({
  title,
  subtitle,
  gradient = false,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
      {...props}
    >
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {gradient ? <GradientText>{title}</GradientText> : title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-base text-muted-foreground text-pretty">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  )
}
