# VOLTA — Electric Car Index

Single-product web app (no monorepo). TanStack Start (React 19, SSR + server routes) + Vite 8 + TypeScript + Tailwind v4 + shadcn/ui. The EV dataset is bundled in-repo under `src/data/cars/`; there is no database or external backend.

## Cursor Cloud specific instructions

- Package manager is **npm** (`package-lock.json`). The `pnpm` block in `package.json` is unused.
- One process runs everything: `npm run dev` (Vite on port 3000) serves both the SSR UI and the `/api/*` server routes (e.g. `/api/cars`, `/api/cars/$id`). No separate backend, database, cache, or auth service is needed.
- There is **no lint script**; `npm run typecheck` (`tsc --noEmit`) is the type/quality gate. Standard commands (dev/build/test/typecheck/start) are documented in `README.md` and `package.json`.
- `npm run check:images` and `scripts/fetch-seed.sh` / `scripts/seed-cars.mjs` require outbound network access (Wikimedia / Open EV Data) and are optional; the app works fully offline since data is bundled.
- Cars without a Commons photo fall back to a designed brand-gradient placeholder, so missing images are expected, not a bug.
