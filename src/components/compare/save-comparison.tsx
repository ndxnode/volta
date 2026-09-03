import { useState } from 'react'
import { BookmarkPlus } from 'lucide-react'

import type { Car } from '@/lib/car-schema'
import { useSavedComparisons } from '@/hooks/use-saved-comparisons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Inline "save this comparison" form shown above the compare table. Names the
 * current selection and persists it as a SavedComparison the user can revisit
 * from /wishlist. Renders nothing for selections too small to save (< 2 cars),
 * matching the compare page's own 2-car minimum.
 */
export function SaveComparison({ cars }: { cars: Car[] }) {
  const { save } = useSavedComparisons()
  const [name, setName] = useState('')

  if (cars.length < 2) return null

  const carIds = cars.map((car) => car.id)
  const defaultName = cars.map((car) => car.model).join(' vs ')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const saved = save(name, carIds)
    setName('')

    // YOUR TURN: give the user feedback after a save.
    // `saved` is the new SavedComparison on success, or null if nothing saved.
    // 1. Import the toast helper at the top: `import { toast } from 'sonner'`
    // 2. On success show `toast.success(...)` mentioning `saved.name` (e.g. a
    //    description like "View it on your wishlist."); on null, `toast.error(...)`.
    // See src/components/detail/car-hero.tsx for the toast pattern in this app.
    // The line below keeps the build green — replace it with real feedback.
    void saved
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass flex flex-wrap items-center gap-2 rounded-[var(--radius)] border-border/80 p-3"
      aria-label="Save this comparison"
    >
      <label htmlFor="save-comparison-name" className="sr-only">
        Name this comparison set
      </label>
      <Input
        id="save-comparison-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={defaultName}
        maxLength={60}
        className="h-8 w-full flex-1 sm:w-auto sm:min-w-[16rem]"
      />
      <Button type="submit" size="sm" data-icon="inline-start">
        <BookmarkPlus aria-hidden />
        Save set
      </Button>
    </form>
  )
}
