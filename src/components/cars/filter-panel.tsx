import * as React from 'react'
import { SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import { BodyStyle, Drivetrain } from '@/lib/car-schema'
import { formatPrice, formatRange } from '@/lib/format'

export const PRICE_BOUNDS = { min: 15_000, max: 350_000 } as const
export const RANGE_BOUNDS = { min: 80, max: 600 } as const

export interface FilterValues {
  make: string[]
  body: string[]
  drive: string[]
  priceMin?: number
  priceMax?: number
  rangeMin?: number
}

interface FilterPanelProps {
  /** All make names present in the dataset, used to build the checkbox list. */
  makeOptions: string[]
  values: FilterValues
  onChange: (patch: Partial<FilterValues>) => void
  /** Count of active filters, shown on the mobile trigger badge. */
  activeCount: number
}

const BODY_STYLES = BodyStyle.options
const DRIVETRAINS = Drivetrain.options

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

/** The filter controls themselves — shared between the desktop rail and mobile sheet. */
function FilterControls({ makeOptions, values, onChange }: Omit<FilterPanelProps, 'activeCount'>) {
  const priceMin = values.priceMin ?? PRICE_BOUNDS.min
  const priceMax = values.priceMax ?? PRICE_BOUNDS.max
  const rangeMin = values.rangeMin ?? RANGE_BOUNDS.min

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="font-display text-sm font-medium text-foreground">Make</legend>
        <div className="max-h-48 space-y-2.5 overflow-y-auto pr-3">
          {makeOptions.map((make) => {
            const id = `make-${make}`
            const checked = values.make.includes(make)
            return (
              <div key={make} className="flex items-center gap-2.5">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() => onChange({ make: toggleInList(values.make, make) })}
                />
                <Label htmlFor={id} className="font-normal text-muted-foreground">
                  {make}
                </Label>
              </div>
            )
          })}
        </div>
      </fieldset>

      <Separator />

      <fieldset className="space-y-3">
        <legend className="font-display text-sm font-medium text-foreground">Body style</legend>
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          spacing={2}
          value={values.body}
          onValueChange={(next: string[]) => onChange({ body: next })}
          className="flex-wrap"
        >
          {BODY_STYLES.map((body) => (
            <ToggleGroupItem key={body} value={body} className="capitalize">
              {body}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </fieldset>

      <Separator />

      <fieldset className="space-y-3">
        <legend className="font-display text-sm font-medium text-foreground">Drivetrain</legend>
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          spacing={2}
          value={values.drive}
          onValueChange={(next: string[]) => onChange({ drive: next })}
        >
          {DRIVETRAINS.map((drive) => (
            <ToggleGroupItem key={drive} value={drive}>
              {drive}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </fieldset>

      <Separator />

      <fieldset className="space-y-3">
        <div className="flex items-baseline justify-between">
          <legend className="font-display text-sm font-medium text-foreground">Price</legend>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatPrice(priceMin)} – {formatPrice(priceMax)}
          </span>
        </div>
        <Slider
          min={PRICE_BOUNDS.min}
          max={PRICE_BOUNDS.max}
          step={2_500}
          value={[priceMin, priceMax]}
          aria-label="Price range"
          onValueChange={([nextMin, nextMax]) =>
            onChange({
              priceMin: nextMin <= PRICE_BOUNDS.min ? undefined : nextMin,
              priceMax: nextMax >= PRICE_BOUNDS.max ? undefined : nextMax,
            })
          }
        />
      </fieldset>

      <Separator />

      <fieldset className="space-y-3">
        <div className="flex items-baseline justify-between">
          <legend className="font-display text-sm font-medium text-foreground">Min range</legend>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatRange(rangeMin)}
          </span>
        </div>
        <Slider
          min={RANGE_BOUNDS.min}
          max={RANGE_BOUNDS.max}
          step={10}
          value={[rangeMin]}
          aria-label="Minimum range"
          onValueChange={([next]) =>
            onChange({ rangeMin: next <= RANGE_BOUNDS.min ? undefined : next })
          }
        />
      </fieldset>
    </div>
  )
}

/**
 * Desktop sidebar rail. Gated to wide screens by its own wrapper so callers can
 * mount it unconditionally. Controlled by the parent (URL state).
 */
export function FilterRail(props: Omit<FilterPanelProps, 'activeCount'>) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24">
        <h2 className="mb-4 font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Filters
        </h2>
        <FilterControls {...props} />
      </div>
    </aside>
  )
}

/**
 * Mobile "Filters" button that opens a Sheet containing the same controls.
 * Gated to small screens; mount alongside the result count / sort toolbar.
 */
export function FilterPanel(props: FilterPanelProps) {
  const { activeCount, ...controls } = props
  const [open, setOpen] = React.useState(false)

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <SlidersHorizontal aria-hidden />
            Filters
            {activeCount > 0 ? (
              <span className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 font-mono text-[10px] tabular-nums text-primary">
                {activeCount}
              </span>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[88vw] max-w-sm">
          <SheetHeader>
            <SheetTitle className="font-display">Filters</SheetTitle>
            <SheetDescription>
              Refine the lineup by make, body, drive, price and range.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 px-4 pb-6">
            <FilterControls {...controls} />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
