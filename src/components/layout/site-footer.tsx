export function SiteFooter() {
  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-base font-bold tracking-[0.18em] text-foreground">
            VOLTA
          </span>
          <span aria-hidden className="font-display text-base font-bold text-primary">
            //
          </span>
        </div>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Data: OpenEV Data (CDLA-Permissive-2.0) · EPA fueleconomy.gov · Photos:
          Wikimedia Commons (per-photo credits on each car)
        </p>
      </div>
    </footer>
  )
}
