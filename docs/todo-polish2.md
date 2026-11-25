# todo-polish2 — Sprint 4+ backlog

Deferred and scheduled polish items. `docs/SPRINT-4.md` is the sprint board;
this file is the checklist. Nothing is in code yet.

## Sprint 4 — P0: Map performance (`src/islands/map/MapLibreMap.tsx`, `src/lib/map/floorplan.ts`)

- [x] **`boothAtFramePoint` (pointermove hot path)**
  - [x] Precompute per-booth hit constants once at module load: center,
        inverse-rotation `cos/sin`, padded inner half-extents — no trig per move.
  - [x] Broad-phase AABB rejection before the rotated exact test.
  - [x] Keep the API stable; add RBush/quadtree only if booths grow to hundreds
        (current roster ≈30 — do not add a dependency yet).
  - [x] Unit-test rotated corners; behavior must stay identical.
  - Done in `floorplan.ts` (`BOOTH_HIT_TARGETS`) + `floorplan.test.ts`.
    Homography util tests live in `homography.test.ts`. Vitest only — not a
    blocking CI gate yet. No spatial index added (24 booths).
- [ ] **`syncOverlay` homography**
  - [ ] Camera dirty check (`center/zoom/bearing/pitch`, canvas size, DPR) —
        skip `solveHomography` when unchanged.
  - [ ] Keep `lastMatrixRef` CSS compare as the second guard.
  - [ ] Worker offload: **not planned** (solve is sub-ms; `map.project()` must
        stay on the main thread). Revisit only if profiler shows >1–2 ms.
- [x] **React hydration / re-render split**
  - [x] Memoized `MapControls` (zoom/compass/recenter, ref-stable callbacks).
  - [x] Memoized `FloorWipe` (PixelTransition veil).
  - [x] `MapTooltipHost` subscribes to hover/selection itself so hovering does
        not re-evaluate the whole island JSX.
  - [x] Audit store selectors: field-scoped only.
  - Done: `MapControls.tsx`, `FloorWipe.tsx`, `MapTooltipHost.tsx`;
    `MapLibreMap` no longer subscribes to `hoveredBoothId`. Store audit found
    no bare `useMapStore()` calls.
  - Floor wipe now keys on venue/area/track (all plan tabs), mounts in a
    layout effect before paint, and runs at 0.18 s per step (~360 ms total).
    GIK stays a camera-only overview, so it does not veil the first venue
    click after a hard reload.
- [ ] **Layout thrashing**
  - [ ] `will-change: transform` + `contain: layout paint` audit on warped
        layers and the pixel veil.
  - [ ] No read-after-write in hot paths (no `getBoundingClientRect` in the
        render loop; document the hot-path contract).
- [ ] Acceptance: hover p95 main-thread < 8 ms; zero homography solves while
      idle; hover re-renders only the tooltip host; Recalc style / Layout time
      well below the 135 ms / 116 ms baseline.

## Sprint 4 — P1: Share modal (uniform styling)

- [x] `src/components/map/ShareBoothButton.tsx`: replace the light rounded
      popover with the map card language — dark `#141416`, `border-line`,
      sharp corners, `font-heading` title, white slab copy CTA.
  - Done: `SharePopup.tsx` uses FF `Elevated` / `Button` / `Input` with local
    shadcn token aliases. Layout follows the shadcn reference: title, social
    row, hairline, “Or copy link” field, white icon copy slab.
- [x] X / WhatsApp as bordered brand chips (no full-bleed green).
  - Done: both are `Button` tertiary chips; only the WhatsApp glyph carries
    the brand green.
- [x] Extract a reusable share-popup shell (walk-in room share later).
  - Done: `SharePopup` takes title/url/labels/channels/onCopy and owns the
    copied state; the booth trigger is now a thin wrapper around it.
- [x] Keep `share.send` analytics + a11y (escape/focus) intact.
  - Done: copy/channel callbacks still emit `share.send`; Base UI Popover
    retains Escape/focus return; copy label is `aria-live`.

## Sprint 4 — P1: Stats bento + skeleton

- [x] Unify all eight `Insights` cells on one anatomy: 11px muted label,
      24px Priego value, identical padding/alignment/hairline grid
      (`Insights.tsx` + `KpiTile.tsx` drift).
  - Done: all eight cells render through `KpiTile`; `variant="stat"` adds the
    shared caption row, `variant="kpi"` adds the chart. Same 12px padding,
    11px muted label, 24px Priego value, caption slot, hairline grid.
- [x] `InsightsSkeleton` mirroring final cell geometry (shimmer, zero CLS).
      Wire only when Insights data becomes async.
  - Done: `InsightsSkeleton.tsx` mirrors four stat cells, four KPI cells, and
    six sector rows with matched 16.5/24/16/36px rows. `Insights` accepts a
    `loading` prop and swaps to it; current static callers stay on the real
    data until the provider becomes async.

## Sprint 4 — P2: 404 with Sparky

- [x] Export mascot as design SVG (`public/mascot/sparky.svg`) from Figma
      node `2142:22497` (`.ico` favicon stays; no other intermediates).
- [x] Compose `src/pages/404.astro`: Sparky hero, Persona-5 copy, CTAs to
      `/map` + `/`; optional splash `PixelTransition` entrance.
- [x] Verify desktop + mobile; keep `BrandLockup` continuity.

## Deferred — design pass needed

- [x] **Empty states (Sparky art, one line + one CTA)**
  - [x] Search / no results
  - [x] Saved / bookmarks empty
  - [x] Walk-in day without bookings
  - [x] Company card without openings
  - [x] Sessions section empty
  - Done: `EmptyState.tsx` uses the exact Figma Sparky art
    (`2208:22966` neutral, `2214:23182` sad) with DOM title/description.
    Openings also show the sad variant only when the data status is
    `unavailable`; mapping/sync errors never reach the UI.
- [ ] **Bookmark sessions / interviews / speakers**
  - [ ] Typed bookmark model + store migration v1→v2
  - [ ] Surfaces: WalkInDetail cards, CompanySessions rows (walk-in + stage),
        HappeningNow
  - [ ] `BookmarkList` groups by type with deep links
- [ ] **Search expansion (sessions, interviews, jobs)**
  - [ ] Memoized flat index (companies/booths/sessions/stage/walk-in/openings),
        grouped + ranked results, cap ~50 + "show all"
  - [ ] Job search deep-links to the company detail openings section
- [ ] **Mobile day switching** — open decision (see `BACKLOG.md`); do not
      implement without the user's call.



## 19 — Vercel Speed Insights (performance monitoring)

- [ ] Enable Speed Insights for the Vercel project.
- [ ] Add `@vercel/speed-insights` with Bun and commit both `package.json`
      and `bun.lock` (perform dependency updates in the Linux dev container
      so the lock retains Linux native optional packages required by CI).
- [ ] Import `SpeedInsights` from `@vercel/speed-insights/astro` in the
      shared Astro layout and render `<SpeedInsights />` once near the end
      of the document.
- [ ] Deploy, visit `/map`, and navigate between pages to generate real
      visits; check the Speed Insights dashboard after the first events.
- [ ] If no events appear after ~30 seconds, retry without content blockers
      and confirm the Speed Insights script is present in the deployed page.
- [ ] Record a baseline for Core Web Vitals and review it after map-loading,
      image, or bundle-performance changes. Do not treat lab/build warnings
      as field metrics; Speed Insights reports real-user measurements.


## 20 — Post-MVP mobile polish + bandwidth budget

This is a deliberate follow-up after the map MVP is stable. Preserve the
Persona 5-inspired art direction; improve mobile hierarchy and ergonomics
without replacing the visual system with a generic component kit.

### Mobile layout and interaction

- [ ] Capture and review the map at 320, 360, 375, 390, and 430px widths,
      plus a short landscape viewport. Start with the current screenshot:
      search/filter controls and quick-find chips compete for the narrow top
      band while map labels and the plan need to remain legible underneath.
- [ ] Rework the mobile top-control hierarchy: search remains the primary
      action; filters stay reachable without squeezing the field; quick-find
      chips wrap/scroll intentionally and never collide with the map chrome.
      Preserve the dark, high-contrast, angled Persona 5 visual language.
- [ ] Check safe-area insets, browser chrome/keyboard resize, vertical space,
      and one-handed reach. Keep important controls clear of notches, the
      bottom sheet, and map gestures.
- [ ] Verify at least 44×44px effective touch targets for primary controls;
      test touch/drag separation between map pan, sheet drag, sheet content
      scroll, and horizontal chip scrolling.
- [ ] Test sheet peek/detail/full states on short and tall phones, including
      keyboard open, long company names, empty search results, and booth
      selection. Keep visible map context and avoid blocking the selected
      booth with the sheet.
- [ ] Run the complete mobile journey: search/filter → select booth →
      bookmark/share → switch day/track → use facilities and registration.
      Check keyboard access, reduced motion, and no hover-only affordances.

### UI primitives / library decision

- [ ] Prefer the existing **Base UI + Tailwind tokens + Motion** stack for
      new mobile controls. Base UI is already installed and unstyled, so it
      can provide accessible interaction primitives without imposing a new
      visual theme or fighting the custom map composition.
- [ ] Do not add a broad mobile UI SDK solely for the screenshot. If the
      custom bottom sheet still has gesture, snap-point, or accessibility
      defects after the mobile audit, prototype **Vaul** as a narrowly scoped
      drawer alternative and compare it against `MobileBottomSheet` before
      adopting it. Keep the current visuals either way.

### Asset and transfer budget

- [ ] Record a baseline for the built `/map` route: initial transferred bytes,
      JS/CSS, fonts, map SVGs, and tile requests on a cold mobile visit and a
      repeat visit. Keep the landing's public assets out of the MVP request
      path; merely being present in `public/` does not mean visitors download
      them.
- [ ] Audit the 15 Priego OTF files (about 1.52 MB total). `fonts.css`
      declares eight upright weights; confirm the seven italic files have no
      consumers, then remove unused files and evaluate WOFF2 for the weights
      actually used. Preload only the critical heading/body font faces.
- [ ] Review 28 identical-file groups under `public/` (about 477 KB of
      duplicate payload). Consolidate paths only after checking every
      reference; avoid breaking Figma-exported landing compositions.
- [ ] Inspect the map SVG payloads (`gik-hall-c1.svg` ~74 KB and
      `gik-hall-c1-inner.svg` ~60 KB) for safe SVG optimization and unused
      layers. Preserve exact geometry, IDs, hit targets, and intentional bleed.
- [ ] Confirm poster WebP dimensions and responsive display sizes; avoid
      downloading full-resolution posters until opened. Keep the current
      poster WebPs (~152 KB combined) unless measured transfer shows a problem.
- [ ] Measure actual Vercel usage during internal testing and estimate peak
      event transfer as `attendees × average bytes transferred per visit`.
      Include map-tile provider quotas separately; map tiles may be served
      directly by the style provider rather than Vercel.
- [ ] Set a mobile cold-load budget and check it with Speed Insights plus
      browser network traces. Optimize measured hotspots first; do not delete
      assets just to reduce repository size if they are not requested.

## 21 — Mobile-first Lighthouse / map boot optimization plan

Plan only — preserve the current map art direction. Prioritize mobile behavior
and measured bottlenecks; do not add manual chunking or self-host the basemap.

- [x] **Splash timing:** reduce `MIN_VISIBLE_MS` to **400ms** and `EXIT_MS`
      to **400ms**. Keep the map-ready signal and maximum safety timeout; check
      the transition on both fast and slow mobile connections.
  - Done: `MIN_VISIBLE_MS = 400`, `EXIT_MS = 400`, PixelTransition step
    matched to **0.18s** (~360ms) so the exit is not cut off. `MAX_VISIBLE_MS`
    stays 6000 as the safety cap.
- [x] **Warm the basemap origin:** add `preconnect` (and `dns-prefetch` as a
      fallback) for the actual OpenFreeMap/style resource origins. Keep the
      existing remote style; do not self-host it. Inspect the style's sprite,
      glyph, and tile URLs before deciding whether any additional origins
      need hints.
  - Done: style, tiles, sprite, and glyphs all resolve to
    `https://tiles.openfreemap.org`; added both hints in `BaseLayout.astro`.
- [x] **Remove mobile backdrop blur over WebGL:** replace the search and
      filter controls' `backdrop-blur` over the moving map with a sufficiently
      opaque translucent fill. Preserve the dark/pink styling; verify pan/zoom
      smoothness on a real phone.
  - Done: mobile search + filter use `bg-[#1b1b1f]/95` with no
    `backdrop-blur`; desktop keeps `md:bg-field/30`.
- [x] **Fix the missing `wood-pattern` image warning:** identify which style
      layer requests it, then either provide the correctly sized image before
      that layer renders or remove the stale pattern reference if unused.
      Recheck the console after the style loads.
  - Done: OpenFreeMap's `landcover_wood` still points at `wood-pattern`, but
    the current sprite JSON has no such image. The layer's `fill-pattern` is
    removed on `style.load`, leaving the flat granite `fill-color`.
- [ ] **Poster delivery:** verify the reported `career-expo.webp` display
      dimensions and reference. If it is shown as a ~126×96 thumbnail, create
      a small responsive thumbnail and load the full poster only when opened;
      preserve aspect ratio and meaningful alt text.
- [ ] **Accessibility:** audit icon-only button names and tab semantics;
      correct any `aria-controls` reference that does not point to a real
      panel. Recheck the reported white-on-pink/green/red text combinations
      against their actual font sizes and contrast requirements; adjust the
      foreground/background pairing without flattening the brand palette.
- [ ] **SEO / indexing:** identify the source of the reported `X-Robots-Tag:
      noindex`. Keep internal Preview/staging deployments noindexed; remove
      it from production only when the public launch is approved. Verify the
      production title, description, and Open Graph metadata at the same time.
- [ ] **404 cleanup:** locate the reported `main-poster.webp` request and fix
      its reference or remove the stale request. Confirm a clean network log.
- [ ] **Breakpoint-first acceptance:** test 320 / 360 / 375 / 390 / 430px,
      then 768px. Check search/filter fit, chip wrapping, safe areas, 44px
      effective touch targets, map/sheet gesture separation, and no clipped
      map labels or controls.
- [ ] **Measure before further JS changes:** capture mobile Lighthouse and a
      throttled network trace before/after. Track LCP, TBT, map-ready time,
      and the first usable map frame. Do not manually split chunks; defer or
      lazy-load code only if the trace shows it delays the first usable frame.

---



### B. Copywriting: hunt AI-slop copy with the detector

- [ ] Run the detector's copy rules over the app — `marketing-buzzword`,
      `aphoristic-cadence`, `theater-slop-phrase`, `em-dash-overuse` —
      against rendered pages (they're element rules: scan the running dev
      server, not regex) and manually sweep `ui.json` +
      `EventInfo`/`Insights` copy for the same tells.
- [ ] Kill useless copy: filler eyebrows, "Discover the experience" class
      lines, redundant labels that restate the UI (a search field doesn't
      need the word "Search" twice), stats copy that hedges
      ("up to ~N+"). Keep voice consistent with the Persona-5 energy —
      short, punchy, Indonesian-first per `lang="id"` where applicable.
- [ ] Record any intentional keepers as DECISIONS (e.g. the event tagline
      survives a rule hit because it's brand).

### Recipes per surface

- [ ] **Press feedback:** keep the global `:active scale(0.97)` — Emil's
      rule, already in `global.css`; ensure transition targets transform
      only (150–160ms var(--ease-out) or spring.fast).
- [ ] **Nothing enters from `scale(0)`:** audit all entrances — dropdowns
      and tooltip already start at 0.95 + opacity (correct); keep it that
      way for the sheet, detail view, and any new surface.
- [ ] **Origin-aware popovers:** track dropdown keeps `transform-origin:
      top left` (trigger-anchored); map tooltip keeps `center bottom`
      (anchored above the booth). New popovers derive origin from their
      trigger, never center (modals exempt).
- [ ] **Interruptible UI:** CSS transitions (current pattern) or
      springs — never keyframes for anything users trigger repeatedly
      (dropdown, tooltip, sheet). `@starting-style` entries are correct;
      keep them.
- [ ] **Tooltips:** instant reopen on adjacent targets (skip delay/animation
      after the first); ≤200ms; the map tooltip's follow is positional, so
      no entry delay beyond the first.
- [ ] **Sheet:** drag stays 1:1 (current pointer code is right); on
      release, snap via spring (FF) instead of the 350ms CSS height tween;
      if height animation stays, FLIP-measure per custom-motion.md and
      keep `transform`/`opacity` for any content crossfade inside the
      sheet (Emil: blur ≤ 2px can mask the crossfade if it reads muddy).
- [ ] **Lists (venue list, search results, sheet content):** FF
      `reveal-items` or Emil's stagger — 30–80ms delays, non-uniform, ONE
      entrance per container (see choreograph), never blocking
      interaction; skip stagger entirely on keyboard-initiated tab switches.
- [ ] **Icon swaps:** rail Info ⇄ CircleHelp and bookmark fill/empty
      crossfade in one grid cell (FF recipe, slight blur + scale) — the
      slot never resizes.
- [ ] **State changes that move layout** (detail ⇄ list swap in sidebar,
      sheet height): FLIP from snapshot — measure, commit, play from old
      position with the tier's spring, `.exit` for dismissal.
- [ ] **Hover:** gated behind `(hover: hover) and (pointer: fine)` (§2);
      hover fills transition `--hover` at spring.fast — no transform
      hover lift on rows (gliding fluid hover from §0 replaces it).

### Should it animate at all? (Emil's frequency test)

- [ ] **Never animate:** Ctrl K focus (keyboard-initiated), zoom buttons,
      compass reset, day-picker switches, sidebar tab switches, search
      typing — high-frequency actions get instant state changes (Raycast
      rule).
- [ ] **Standard animation (occasional):** track dropdown, map tooltip,
      sheet snap, detail view entry, share feedback.
- [ ] **Delight allowed (rare):** first-visit entry reveal, empty states.
- [ ] Map camera moves (flyTo/easeTo) are MapLibre's domain — leave their
      easing alone; only UI chrome follows this section.
