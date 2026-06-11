import { Heart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useFavorites } from '@/hooks/use-favorites'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  carId: string
  /** Accessible name suffix, e.g. "Tesla Model 3". */
  carLabel: string
  size?: 'sm' | 'default'
  className?: string
}

/**
 * Heart toggle backed by the favorites store. Safe inside card links:
 * it stops propagation so toggling never navigates.
 */
export function FavoriteButton({
  carId,
  carLabel,
  size = 'default',
  className,
}: FavoriteButtonProps) {
  const { ids, toggle } = useFavorites()
  const favorited = ids.includes(carId)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={favorited}
      aria-label={
        favorited ? `Remove ${carLabel} from favorites` : `Add ${carLabel} to favorites`
      }
      className={cn(
        'text-muted-foreground hover:text-foreground',
        size === 'sm' && 'size-8',
        favorited && 'text-primary hover:text-primary',
        className,
      )}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggle(carId)
      }}
    >
      <Heart
        aria-hidden
        className={cn('size-4 transition-transform duration-150', favorited && 'fill-current scale-110')}
      />
    </Button>
  )
}
