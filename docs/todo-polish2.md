# todo-polish2 — Sprint 4+ backlog

Deferred and scheduled polish items. `docs/SPRINT-4.md` is the sprint board;
this file is the checklist. Nothing is in code yet.

## Sprint 4 — P0: Map performance (`src/islands/map/MapLibreMap.tsx`, `src/lib/map/floorplan.ts`)

- [ ] **`boothAtFramePoint` (pointermove hot path)**
  - [ ] Precompute per-booth hit constants once at module load: center,
        inverse-rotation `cos/sin`, padded inner half-extents — no trig per move.
  - [ ] Broad-phase AABB rejection before the rotated exact test.
  - [ ] Keep the API stable; add RBush/quadtree only if booths grow to hundreds
        (current roster ≈30 — do not add a dependency yet).
  - [ ] Unit-test rotated corners; behavior must stay identical.
- [ ] **`syncOverlay` homography**
  - [ ] Camera dirty check (`center/zoom/bearing/pitch`, canvas size, DPR) —
        skip `solveHomography` when unchanged.
  - [ ] Keep `lastMatrixRef` CSS compare as the second guard.
  - [ ] Worker offload: **not planned** (solve is sub-ms; `map.project()` must
        stay on the main thread). Revisit only if profiler shows >1–2 ms.
- [ ] **React hydration / re-render split**
  - [ ] Memoized `MapControls` (zoom/compass/recenter, ref-stable callbacks).
  - [ ] Memoized `FloorWipe` (PixelTransition veil).
  - [ ] `MapTooltipHost` subscribes to hover/selection itself so hovering does
        not re-evaluate the whole island JSX.
  - [ ] Audit store selectors: field-scoped only.
- [ ] **Layout thrashing**
  - [ ] `will-change: transform` + `contain: layout paint` audit on warped
        layers and the pixel veil.
  - [ ] No read-after-write in hot paths (no `getBoundingClientRect` in the
        render loop; document the hot-path contract).
- [ ] Acceptance: hover p95 main-thread < 8 ms; zero homography solves while
      idle; hover re-renders only the tooltip host; Recalc style / Layout time
      well below the 135 ms / 116 ms baseline.

## Sprint 4 — P1: Share modal (uniform styling)

- [ ] `src/components/map/ShareBoothButton.tsx`: replace the light rounded
      popover with the map card language — dark `#141416`, `border-line`,
      sharp corners, `font-heading` title, white slab copy CTA.
- [ ] X / WhatsApp as bordered brand chips (no full-bleed green).
- [ ] Extract a reusable share-popup shell (walk-in room share later).
- [ ] Keep `share.send` analytics + a11y (escape/focus) intact.

## Sprint 4 — P1: Stats bento + skeleton

- [ ] Unify all eight `Insights` cells on one anatomy: 11px muted label,
      24px Priego value, identical padding/alignment/hairline grid
      (`Insights.tsx` + `KpiTile.tsx` drift).
- [ ] `InsightsSkeleton` mirroring final cell geometry (shimmer, zero CLS).
      Wire only when Insights data becomes async.

## Sprint 4 — P2: 404 with Sparky

- [ ] Export mascot as design SVG (`public/mascot/sparky.svg`) from Figma
      node `2142:22497` (`.ico` favicon stays; no other intermediates).
- [ ] Compose `src/pages/404.astro`: Sparky hero, Persona-5 copy, CTAs to
      `/map` + `/`; optional splash `PixelTransition` entrance.
- [ ] Verify desktop + mobile; keep `BrandLockup` continuity.

## Deferred — design pass needed

- [ ] **Empty states (Sparky art, one line + one CTA)**
  - [ ] Search / no results
  - [ ] Saved / bookmarks empty
  - [ ] Walk-in day without bookings
  - [ ] Company card without openings
  - [ ] Sessions section empty
- [ ] **Bookmark sessions / interviews / speakers**
  - [ ] Typed bookmark model + store migration v1→v2
  - [ ] Surfaces: WalkInDetail cards, CompanySessions rows (walk-in + stage),
        HappeningNow
  - [ ] `BookmarkList` groups by type with deep links
- [ ] **Search expansion (sessions, interviews, jobs)**
  - [ ] Memoized flat index (companies/booths/sessions/stage/walk-in/openings),
        grouped + ranked results, cap ~50 + "show all"
  - [ ] Virtualization research: dataset ≈25 companies / ~15 bookings /
        ~50 openings — react-window likely wasted; prefer TanStack Virtual
        only past ~200 rows or a failed 16 ms budget; record the decision in
        `docs/decisions/`
  - [ ] Job search deep-links to the company detail openings section
- [ ] **Mobile day switching** — open decision (see `BACKLOG.md`); do not
      implement without the user's call.
