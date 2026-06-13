# VOLTA — Electric Car Index

An elegant, dark-only sci-fi showroom for browsing, comparing, and exploring **104 electric cars**
across 33 makes. Built with TanStack Start, React, TypeScript, Tailwind v4, and shadcn/ui.

## Features

- **Browse** (`/cars`) — responsive grid with live make / body / drivetrain / price / range filters and
  sorting, all persisted in the URL (shareable, survives reload + back/forward).
- **Detail** (`/cars/$id`) — hero with brand-accent backwash, animated stat bars, and a full spec sheet.
- **Compare** (`/compare`) — line up to 3 EVs side by side with **best-in-row** highlighting (knows which
  metrics are higher- vs lower-is-better). Deep-linkable: `/compare?cars=a,b,c`.
- **Command palette** (`⌘K`) — instant fuzzy search across the lineup plus quick navigation.
- **Stats** (`/stats`) — range-vs-price scatter by drivetrain, average battery by brand, and an
  efficiency leaderboard, with animated headline tiles.
- **Favorites** (`/favorites`) — saved to `localStorage`, synced across tabs.

## Tech

| Concern | Choice |
| --- | --- |
| Framework | TanStack Start (React 19, file-based routing, SSR, server routes) |
| Data fetching | TanStack Query (route-loader `ensureQueryData` + `useSuspenseQuery`) |
| Styling | Tailwind v4 (CSS-first `@theme`, oklch tokens) + shadcn/ui |
| Validation | Zod (`CarSchema` is the single source of truth; bounds double as plausibility checks) |
| Animation | `motion` (`LazyMotion` + `domAnimation`), `MotionConfig reducedMotion="user"` |
| Charts | Recharts via shadcn `chart`, mounted behind `ClientOnly` (SSR-safe) |

State boundaries: **server data** → TanStack Query (`staleTime: Infinity`); **filters/sort** → URL via
`validateSearch`; **compare** → `useSyncExternalStore` over `sessionStorage` (max 3); **favorites** →
`useSyncExternalStore` over `localStorage`.

## The API

The app serves its own data through TanStack Start server routes — a real, curl-able boundary:

```bash
curl localhost:3000/api/cars | jq length            # 104
curl "localhost:3000/api/cars?body=suv&drive=AWD"   # filtered (reuses lib/car-filters)
curl -i localhost:3000/api/cars/does-not-exist      # 404 {"error":"not_found"}
```

The client fetches the full list once and filters in memory, so sliders and `⌘K` are instant.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run typecheck    # tsc --noEmit
npm test             # vitest (car-filters, format, dataset integrity)
npm run check:images # HEAD-checks every imageUrl resolves (throttled, browser UA)
npm run build        # production SSR build
npm run start        # serve the production build
```

## Data & attribution

The dataset is assembled from open, redistribution-friendly sources and hand-curated for US pricing and
photography:

- **Specs** — [Open EV Data](https://github.com/open-ev-data/open-ev-data-dataset) v1.24.0
  (battery kWh, charge rates, WLTP/EPA range, body/dimensions). Licensed **CDLA-Permissive-2.0**.
- **EPA range** — [fueleconomy.gov](https://www.fueleconomy.gov/) (US EPA, public domain).
- **Prices** — researched US MSRP per trim; non-US-market models use a converted estimate and are
  flagged accordingly in the curation notes.
- **Photos** — [Wikimedia Commons](https://commons.wikimedia.org/), hotlinked from `upload.wikimedia.org`
  (sanctioned). Each car stores a per-photo `imageAttribution` string (photographer + license) shown in
  the UI; cars without a confident Commons match fall back to a designed brand-gradient placeholder.

`rangeSource` (`EPA` / `WLTP-converted` / `manufacturer-est`) records provenance for every range figure.

## Project layout

```
src/
├── routes/            # __root, index, cars/, compare, stats, favorites, api/
├── data/cars/         # 10 brand-group files + index.ts (merge → zod-parse → dedupe)
├── lib/               # car-schema (source of truth), car-filters, format, queries
├── hooks/             # use-favorites, use-compare (SSR-safe stores)
└── components/        # ui/ (shadcn) · layout · cars · detail · compare · charts · shared
scripts/               # seed-cars, check-images
```
