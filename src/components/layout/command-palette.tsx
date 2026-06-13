import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Car as CarIcon, GitCompareArrows, Heart, Home, LayoutGrid } from 'lucide-react'

import type { Car } from '@/lib/car-schema'
import { carsQueryOptions } from '@/lib/queries'
import { formatPrice } from '@/lib/format'
import { CarImage } from '@/components/shared/car-image'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

// These routes are owned by other agents and may not exist in the route tree
// yet. The `to` values are cast to the router's link target type so this file
// type-checks before those route files land; the casts widen safely once the
// routes are registered.
const QUICK_NAV: { to: LinkProps['to']; label: string; icon: typeof Home }[] = [
  { to: '/cars' as LinkProps['to'], label: 'Browse', icon: LayoutGrid },
  { to: '/compare' as LinkProps['to'], label: 'Compare', icon: GitCompareArrows },
  { to: '/stats' as LinkProps['to'], label: 'Stats', icon: CarIcon },
  { to: '/favorites' as LinkProps['to'], label: 'Favorites', icon: Heart },
  { to: '/' as LinkProps['to'], label: 'Home', icon: Home },
]

const MAX_RESULTS = 8

function matchCars(cars: Car[], query: string): Car[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return cars.slice(0, MAX_RESULTS)
  }
  const terms = q.split(/\s+/)
  return cars
    .filter((car) => {
      const haystack = `${car.year} ${car.make} ${car.model} ${car.variant}`.toLowerCase()
      return terms.every((term) => haystack.includes(term))
    })
    .slice(0, MAX_RESULTS)
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const navigate = useNavigate()

  // Non-suspense: the palette is mounted globally and must never suspend the
  // app shell. Renders gracefully (empty) while the list is loading.
  const { data: cars } = useQuery(carsQueryOptions())

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    function onOpenCommand() {
      setOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('volta:open-command', onOpenCommand)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('volta:open-command', onOpenCommand)
    }
  }, [])

  // Reset the query whenever the palette closes so it reopens clean.
  React.useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  const matches = React.useMemo(() => matchCars(cars ?? [], query), [cars, query])

  function go(to: LinkProps['to'], params?: Record<string, string>) {
    setOpen(false)
    void navigate({ to, params } as Parameters<typeof navigate>[0])
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="VOLTA command palette"
      description="Search electric cars and navigate the showroom"
    >
      {/* shouldFilter=false: we filter cars ourselves so substring/multi-term
          matching stays under our control; cmdk still drives keyboard nav.
          (CommandDialog only provides the Dialog shell, so the Command
          context provider must be mounted here.) */}
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search cars or jump to a page…"
        />
        <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {matches.length > 0 && (
          <CommandGroup heading="Cars">
            {matches.map((car) => {
              const label = `${car.year} ${car.make} ${car.model} ${car.variant}`
              return (
                <CommandItem
                  key={car.id}
                  value={`car ${label}`}
                  onSelect={() => go('/cars/$id' as LinkProps['to'], { id: car.id })}
                >
                  <CarImage
                    src={car.imageUrl ?? undefined}
                    alt={label}
                    accentColor={car.accentColor}
                    className="size-9 shrink-0 rounded-md"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-muted-foreground">{car.make}</span>{' '}
                    {car.model}{' '}
                    <span className="text-muted-foreground">{car.variant}</span>
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatPrice(car.priceUsd)}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {matches.length > 0 && <CommandSeparator />}

        <CommandGroup heading="Quick navigation">
          {QUICK_NAV.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.label}
                value={`nav ${item.label}`}
                onSelect={() => go(item.to)}
              >
                <Icon className="text-muted-foreground" aria-hidden />
                <span>{item.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
