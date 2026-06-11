import * as React from 'react'
import { CarFront } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CarImageProps {
  src?: string
  alt: string
  /** Brand accent used for the fallback radial backwash. Defaults to violet. */
  accentColor?: string
  className?: string
  sizes?: string
}

/**
 * Lazy <img> that swaps to a designed, intentional fallback on error or when
 * no src is provided — a brand-accent radial wash over indigo with a subtle
 * car silhouette and the alt label. Never looks "broken".
 */
export function CarImage({
  src,
  alt,
  accentColor = 'oklch(0.66 0.20 290)',
  className,
  sizes,
}: CarImageProps) {
  const [errored, setErrored] = React.useState(false)
  const showFallback = !src || errored

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'relative flex items-center justify-center overflow-hidden bg-card',
          className,
        )}
        style={{
          backgroundImage: `radial-gradient(120% 120% at 50% 18%, color-mix(in oklch, ${accentColor} 38%, transparent) 0%, transparent 62%)`,
        }}
      >
        <CarFront
          className="size-1/3 max-h-24 max-w-24 text-foreground/15"
          strokeWidth={1.25}
          aria-hidden
        />
        <span className="absolute bottom-2 left-0 right-0 truncate px-3 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {alt}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={cn('object-cover', className)}
    />
  )
}
