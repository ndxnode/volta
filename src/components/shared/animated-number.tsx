import * as React from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps
  extends Omit<React.ComponentProps<'span'>, 'children'> {
  value: number
  /** Formats the in-flight + final number. Defaults to rounded locale string. */
  format?: (n: number) => string
  durationMs?: number
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString()

/**
 * Animates a number from its previous value (or 0) up to `value` by writing
 * directly to the DOM node's textContent on each frame — no React re-render
 * per tick. Renders the final value immediately under prefers-reduced-motion.
 */
export function AnimatedNumber({
  value,
  format = defaultFormat,
  durationMs = 600,
  className,
  ...props
}: AnimatedNumberProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const prefersReduced = useReducedMotion()
  // Track the last displayed numeric value so re-animations start from there.
  const fromRef = React.useRef(0)
  // Keep latest format in a ref so the effect needn't depend on its identity.
  const formatRef = React.useRef(format)
  formatRef.current = format

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    if (prefersReduced) {
      node.textContent = formatRef.current(value)
      fromRef.current = value
      return
    }

    const controls = animate(fromRef.current, value, {
      duration: durationMs / 1000,
      ease: 'easeOut',
      onUpdate: (latest) => {
        node.textContent = formatRef.current(latest)
      },
      onComplete: () => {
        fromRef.current = value
      },
    })

    return () => controls.stop()
  }, [value, durationMs, prefersReduced])

  return (
    <span
      ref={ref}
      className={cn('font-mono tabular-nums', className)}
      // SSR / pre-hydration content so layout is stable and value is readable.
      suppressHydrationWarning
      {...props}
    >
      {format(value)}
    </span>
  )
}
