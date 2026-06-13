import { X } from 'lucide-react'

import { NeonBadge } from '@/components/shared/neon-badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatRange } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface ActiveChip {
  /** Stable key for React + the remove handler. */
  key: string
  label: string
}

interface FilterChipsProps {
  chips: ActiveChip[]
  onRemove: (key: string) => void
  onClearAll: () => void
}

/**
 * Removable chips for the currently-active filters, plus a "Clear all".
 * Renders nothing when no filters are active.
 */
export function FilterChips({ chips, onRemove, onClearAll }: FilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          aria-label={`Remove filter: ${chip.label}`}
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <NeonBadge
            variant="muted"
            className={cn(
              'gap-1 transition-colors',
              '[@media(hover:hover)]:hover:border-primary/40 [@media(hover:hover)]:hover:text-foreground',
            )}
          >
            {chip.label}
            <X className="size-3" aria-hidden />
          </NeonBadge>
        </button>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="text-muted-foreground hover:text-foreground"
        onClick={onClearAll}
      >
        Clear all
      </Button>
    </div>
  )
}

/** Human-readable label for a price-range chip. */
export function priceChipLabel(min?: number, max?: number): string | null {
  if (min === undefined && max === undefined) return null
  if (min !== undefined && max !== undefined) {
    return `${formatPrice(min)} – ${formatPrice(max)}`
  }
  if (min !== undefined) return `From ${formatPrice(min)}`
  return `Up to ${formatPrice(max as number)}`
}

/** Human-readable label for a minimum-range chip. */
export function rangeChipLabel(min?: number): string | null {
  if (min === undefined) return null
  return `${formatRange(min)}+ range`
}
