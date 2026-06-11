import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Inline text with a cyan -> violet gradient clipped to the glyphs.
 * Use for accenting a word or short phrase, not whole paragraphs.
 */
export function GradientText({
  className,
  children,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'bg-gradient-to-r from-[var(--grad-from)] to-[var(--grad-to)] bg-clip-text text-transparent',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
