# Sprint 4 — Performance & Polish (plan)

Status: **planned** · Source: profiler trace + Erwin's notes (24/11/2026)
Execution rule: nothing in this document is implemented yet. P0 lands first;
P2 items are research/spikes until the user promotes them.

## 0. Scope map

| # | Workstream | Priority | Type |
|---|---|---|---|
| 1 | Map performance (hot paths, re-renders, layout) | P0 | code |
| 2 | Share modal restyle + uniform shell | P1 | code |
| 3 | Stats bento uniformity + loading skeleton | P1 | code |
| 4 | 404 page with Sparky mascot | P2 | code + asset |
| 5 | Empty-state designs | deferred | `todo-polish2.md` |
| 6 | Bookmarks for sessions/speakers + searchable index | P2 | research → build |

---

## 1. Map performance (P0)

Target files: `src/islands/map/MapLibreMap.tsx`,
`src/lib/map/floorplan.ts` (`BOOTH_SHAPES`, `boothAtFramePoint`),
`src/islands/map/FloorPlanOverlay.tsx`, `WalkInFloorPlanOverlay.tsx`.

### 1.1 Hot function — `boothAtFramePoint` (pointermove)

Problem: linear scan over `BOOTH_SHAPES` with trig per booth per pointer move.

Plan:
1. **Precompute hit-test constants once at module load** (in `floorplan.ts`):
   per booth `{ id, cx, cy, cos, sin, halfW, halfH }` where `halfW/halfH` are
   the inner box halves + the existing 2px pad. `boothAtFramePoint` then runs
   zero `Math.cos` / `Math.sin` per move.
2. **Broad-phase AABB**: precompute the axis-aligned bounds of each rotated
   inner box; reject candidates by point-in-AABB before the rotated test.
   Removes trig from the common miss path and keeps behavior identical.
3. **Spatial index only when the dataset justifies it**: current roster is
   ~30 boxes, so RBush/quadtree is not worth a dependency. Keep the
   `boothAtFramePoint` API stable so a grid/quadtree can be swapped in later
   if booths grow into the hundreds.
4. Keep the walk-in 2F hit-testing untouched (rooms are DOM buttons, not
   map-level hit-tested).

Acceptance: no trig inside `pointermove`; hit-test ≤ 0.1 ms p95; selection
behavior byte-identical (unit-test the rotated corners).

### 1.2 Hot function — `syncOverlay` (homography)

Problem: `solveHomography` runs on every map `render`/`resize`, even when the
camera did not move.

Plan:
1. **Camera dirty check**: cache `center`, `zoom`, `bearing`, `pitch`,
   `canvas.clientWidth/Height`, `devicePixelRatio`. Skip projection +
   homography when the tuple is unchanged (still write nothing to the DOM).
2. Keep the existing `lastMatrixRef` CSS compare as the second guard.
3. **Worker**: do not plan it in this sprint. At 4 anchor points the solve is
   sub-millisecond; `map.project()` must stay on the main thread, and posting
   points per frame would cost more than the math. Revisit only if the
   profiler shows `solveHomography` > 1–2 ms sustained.

Acceptance: idle/hover produces zero homography solves; camera moves produce
the same matrix as today (golden values in a unit test).

### 1.3 React hydration / re-render

Problem: `MapLibreMap` subscribes to many selectors; hover/selection change
re-evaluates the whole island JSX (trace: `runWithFiberInDEV`).

Plan:
1. **Split the island**: memoized children —
   - `MapControls` (Zoom / Compass / Recenter; callbacks stabilised via refs
     so `memo` actually holds),
   - `FloorWipe` (PixelTransition veil),
   - `MapTooltipHost` (subscribes to `hoveredBoothId` / `selectedBoothId` /
     `selectedFacilityId` / `selectedWalkInRoomId` itself, so hover only
     re-renders the tooltip host, not the whole map shell).
2. **Ref-based fast path** stays the rule for per-frame data: tooltip
   transforms are written imperatively (`positionTooltip`), never through
   store updates per frame.
3. Keep store writes at `moveend` (already true) and re-audit any component
   that subscribes without a selector.

Acceptance: hovering a booth does not re-render the static shell; island
render ≤ 2 ms in React Profiler; sidebar islands untouched by hover.

### 1.4 Layout thrashing

Problem: trace shows Recalculate style 135 ms / Layout 116 ms.

Plan:
1. `will-change: transform` on every warped/moved layer: floor-plan roots
   (already set), tooltip host (already set), the new PixelTransition veil;
   pair with `contain: layout paint` where clipping already exists
   (`map-stage`).
2. **No read-after-write in hot paths**: audit `getBoundingClientRect` /
   `clientHeight` reads — fly-to reads `clientHeight` once per selection
   (fine); tooltip uses `map.project` only (fine). Add a short "hot path
   contract" comment in `MapLibreMap`.
3. Keep DOM writes transform/opacity-only inside `render` handlers.

Acceptance: no forced-reflow warnings in the trace; Layout time below the
style time during camera moves; hover path writes only transforms.

---

## 2. Share modal — uniform styling (P1)

Files: `src/components/map/ShareBoothButton.tsx`, reference shell
`src/islands/map/BoothDetail.tsx` (poster modal) + `surfaceClasses`.

Current: light `#f7f7f8` rounded-2xl popover — the only light surface in the
map chrome, visually detached from the dark, sharp-cornered cards.

Plan:
1. Restyle the popover to the map's card language: dark `#141416` +
   `border-line`, **sharp corners** (radius ladder, like the poster modal),
   `font-heading` title, muted link row, copy action as the white slab CTA.
2. X / WhatsApp as bordered chips with brand glyphs (no full-bleed green).
3. Extract the popup shell so the walk-in room share (future) reuses it;
   keep analytics (`share.send`) untouched.
4. Verify a11y: focus trap/escape like the poster modal, aria labels intact.

Acceptance: share popup matches the poster modal screenshots; no behavior or
analytics change.

---

## 3. Stats bento — uniformity + skeleton (P1)

Files: `src/islands/map/Insights.tsx`, `src/components/map/kpi/KpiTile.tsx`.

Plan:
1. **One cell anatomy** for all eight bento cells: 11px muted label, 24px
   Priego value, optional trend, identical padding and hairline grid. Fix
   drift between the four plain stats and the four `KpiTile`s (label casing,
   baseline alignment, accent usage).
2. **Skeleton spec** (needs wiring later when Insights becomes async):
   `InsightsSkeleton` mirroring the final grid (same cell sizes, shimmer
   blocks, no layout shift on swap). Deliver the component + a short usage
   note; do not fake loading states in static data.
3. Keep sector chart styling as-is unless it contradicts the unified cell
   language.

Acceptance: all eight cells share one visual language; skeleton reuses exact
card geometry (CLS = 0 on swap).

---

## 4. 404 with Sparky (P2)

Asset: re-export the mascot from Figma node `2142:22497`
(file `Bol9R2faeoBcCLXRAEc0Xd`) as a **design SVG** under
`public/mascot/sparky.svg` (the `.ico` stays the favicon; no intermediate
files committed besides the SVG listed here).

Plan:
1. Compose `src/pages/404.astro`: Sparky art (hero, responsive), Persona-5
   headline tone, primary CTA to `/map`, secondary to `/`.
2. Optional: reuse the splash `PixelTransition` for the art entrance
   (respect reduced motion); desktop + mobile frames.
3. Reuse `BrandLockup` for brand continuity; keep the favicon link.

Acceptance: `/404` renders art + working CTAs at both breakpoints; no new
dependencies.

---

## 5. Empty states — deferred to `docs/todo-polish2.md`

Specs written there (search no-results, saved empty, day without bookings,
company without openings, sessions empty) with Sparky as the empty-state
mascot. Not scheduled in this sprint.

---

## 6. Bookmarks + search expansion (P2, research → build)

### 6.1 Bookmarks for sessions / speakers

Problem: bookmarks are booth-id strings; walk-in and stage sessions cannot be
saved.

Plan:
1. Migrate persisted store (`icd-2026-map`) to a typed bookmark:
   `{ type: 'booth' | 'session' | 'stage' | 'walkin', id }` with a v1→v2
   migration of existing ids.
2. Bookmark actions on: WalkInDetail cards, `CompanySessions` rows
   (walk-in + stage), HappeningNow (session).
3. `BookmarkList` groups by type (Booths / Sessions / Walk-ins), each row
   deep-links to its detail.

### 6.2 Searchable sessions, interviews, jobs

Current: search filters booths only; sessions/jobs live inside company cards.

Research notes:
- Dataset is small (≈25 companies, 10 sessions, 9 stage, 15 walk-in bookings,
  ≈50 openings). Rendering all matches is fine; **react-window is premature**
  — it adds complexity for a list well under a few hundred rows.
- Plan: build one memoized flat index
  (`type, id, title, subtitle, keywords, dayId`) for companies, booths,
  sessions, stage talks, walk-in bookings and openings; rank by prefix match →
  substring → keyword; group results by type; cap at ~50 with "show all".
- Revisit virtualization (TanStack Virtual preferred over react-window) only
  if the index exceeds ~200 visible rows or profiling fails the 16 ms filter
  budget. Document the decision in `docs/decisions/`.
- Acceptance: “nindya” surfaces the company + F3/F4 walk-ins + stage session;
  “internship” surfaces openings; keyboard nav + fluid hover work; no
  full-list render regression.

---

## 7. Sequencing

| Slot | Work |
|---|---|
| W1 | 1.1 + 1.2 (instrument first, then optimize) · 2 (share shell) · 4 (404) |
| W2 | 1.3 + 1.4 (split island, layout audit) · 3 (bento + skeleton) |
| W3 | 6.1 bookmark model · 6.2 search index prototype |
| Later | 5 empty states · virtualization research · mobile day switching (open decision in `BACKLOG.md`) |

## 8. Metrics / definition of done

- Map: hover p95 main-thread work < 8 ms; no long task > 50 ms during a
  camera move; zero homography solves while idle.
- React: booth hover re-renders only the tooltip host.
- Trace parity: Recalculate style / Layout time materially below the current
  135 ms / 116 ms baseline on the same interaction script.
- UI: share popup and bento approved visually against the references;
  404 verified on desktop + mobile.

## 9. Risks

- Persisted bookmark migration must be reversible and must not drop ids.
- `PixelTransition` is `@ts-nocheck`; keep usage additive.
- Store selector churn: any new selector must be field-scoped (house rule).
- Mobile brand header history: see `BACKLOG.md` (mobile day switching is an
  open decision; do not smuggle it into this sprint).
