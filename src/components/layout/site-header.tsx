import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

// These routes (/cars, /compare, /stats, /favorites) are owned by other
// agents and may not exist in the route tree yet. The `to` values are cast to
// the router's link target type so this header type-checks before those route
// files land; the casts widen safely once the routes are registered.
const NAV_LINKS: { to: LinkProps['to']; label: string }[] = [
  { to: '/cars' as LinkProps['to'], label: 'Browse' },
  { to: '/compare' as LinkProps['to'], label: 'Compare' },
  { to: '/stats' as LinkProps['to'], label: 'Stats' },
  { to: '/favorites' as LinkProps['to'], label: 'Favorites' },
  { to: '/wishlist' as LinkProps['to'], label: 'Wishlist' },
]

function openCommand() {
  window.dispatchEvent(new CustomEvent('volta:open-command'))
}

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-40 border-b border-border/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <Link
          to="/"
          className="group flex items-center gap-1.5 rounded-md focus-visible:outline-none"
          aria-label="VOLTA home"
        >
          <span className="font-display text-xl font-bold tracking-[0.18em] text-foreground">
            VOLTA
          </span>
          <span
            aria-hidden
            className="font-display text-xl font-bold leading-none text-primary text-glow transition-opacity group-hover:opacity-80"
          >
            //
          </span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'relative rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors',
                'hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
              activeProps={{
                className: 'text-foreground',
              }}
              activeOptions={{ exact: false }}
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  <span
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute inset-x-3 -bottom-px h-px origin-center scale-x-0 bg-primary transition-transform duration-300 ease-out',
                      isActive && 'scale-x-100 shadow-[0_0_8px_var(--neon)]',
                    )}
                  />
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* Search trigger */}
        <button
          type="button"
          onClick={openCommand}
          className={cn(
            'glass group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors',
            'hover:text-foreground hover:border-primary/40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
          aria-label="Open command palette"
        >
          <Search className="size-4" aria-hidden />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  )
}
