import { ArrowDownNarrowWide, ArrowUpNarrowWide } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CAR_SORT_KEYS, type SortDir, type SortKey } from '@/lib/car-schema'

const SORT_LABELS: Record<SortKey, string> = {
  price: 'Price',
  range: 'Range',
  efficiency: 'Efficiency',
  zeroToSixty: '0–60 mph',
  name: 'Name',
}

interface SortSelectProps {
  sort: SortKey
  dir: SortDir
  onSortChange: (sort: SortKey) => void
  onDirChange: (dir: SortDir) => void
}

/**
 * Sort key Select + direction toggle, bound to URL params by the parent.
 */
export function SortSelect({ sort, dir, onSortChange, onDirChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={sort} onValueChange={(value) => onSortChange(value as SortKey)}>
        <SelectTrigger size="sm" aria-label="Sort by" className="w-[9.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CAR_SORT_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {SORT_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={dir === 'asc' ? 'Sort ascending (click for descending)' : 'Sort descending (click for ascending)'}
        onClick={() => onDirChange(dir === 'asc' ? 'desc' : 'asc')}
      >
        {dir === 'asc' ? (
          <ArrowUpNarrowWide aria-hidden />
        ) : (
          <ArrowDownNarrowWide aria-hidden />
        )}
      </Button>
    </div>
  )
}
