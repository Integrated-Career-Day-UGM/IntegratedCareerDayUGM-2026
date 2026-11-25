# Polish — ICD 2026 Map Page

Execution order is top-down. Sources: impeccable polish audit (breakpoints /
padding / type / color) and the Fluid Functionalism stack read.

> **SPRINT ORDER (user, Nov 22):** the doc below was too broad. The next
> sprint is **§18 (IA + sidebar unification) — the 90%**. Sections §3–§17
> are **PARKED in backlog**: do not execute until §18 lands and the user
> prompts. Done already: §0 (FF wiring), §1 (responsive spine), §2 (color
> tokens/surfaces), §10-zoom floor, §12 black-map fix, BoothDetail header,
> bookmark-state subscriptions.

---

## 18 — NEXT SPRINT: IA eye-flow + sidebar unification (the 90%)

The main issue is **grouping and where the eye will look**. The sidebar
currently reads as boxes-in-boxes; the fix is one flat surface per region,
dividers for grouping, a strict sizing ladder, and surface levels that say
what floats.

### A. Sidebar unification (flat surface + dividers, uniform color)
- [ ] **One surface per region, no nested cards.** Kill the box-in-box
      pattern: zone cards (`border-line bg-cardbg` blocks), detail-view
      sub-boxes (tags row, Bookmark/Share/Close trio, opportunity rows all
      sit in their own `bg-card` boxes). Replace with: the panel's own
      surface + hairline dividers (`border-line` 1px) between groups.
- [ ] **List view:** zone cards → single list; zone headers ("ZONE C · 6")
      become *divider rows* (label above a hairline), rows separated by
      hairlines, no per-zone boxes.
- [ ] **Detail view:** one column on the panel surface — title block →
      hairline → meta chips (text-level, not boxed) → hairline → actions
      (ghost/text buttons, not three boxes; the white CTA pair stays boxed
      white = destination) → hairline → opportunities as divider-separated
      rows, not boxed cards.
- [ ] **Uniform color:** collapse the remaining one-off grays
      (`#111`, `#0c0c0f`, `#0e0e0e`, `#1d1d1d`…) onto the surface ladder +
      the two ink steps; the panel, not the cards, carries the color.
- [ ] **Surface levels (FF):** the sidebar panel = one level; anything
      that floats over the map (dropdown, Hall card, tooltip) keeps its
      ladder level; nothing inside the sidebar gets a shadow.

### B. Sizing + reading order (§9 condensed — this IS the IA job)
- [ ] **One dominant element per view, steps ≥3px between roles:**
      - Home: the live-session card dominates (title 17px + pink accent),
        search recedes below it, list rows 13px.
      - Detail: the **company name** is the largest element (22px); CTA
        row (white, 14px) is the scan's terminus at the bottom.
      - Map: floor plan owns everything; only the Hall card + track
        switcher are chrome.
- [ ] **Pink trail (§9 order):** ribbon → live-card accents → selected
      row's left bar / rail rule → day chip + booth glow → **white CTA**.
      Audit every pink use against that order; stray pinks go gray.
- [ ] **Grouping test:** squint at 1440/768/375 — exactly ONE thing should
      pop per region; dividers group, never decorate.

### C. Known visual bugs to catch while in here
- [ ] Detail h2 shows a strikethrough-like artifact through part of the
      company name (screenshot, "Bank Tabungan ~~Negara~~") — reproduce and
      fix (suspect the FluidHoverHighlight or a text node boundary).

### D. Nov 23 desktop pass — shipped

- [x] **Rail:** shares the content surface (`#1d1d1d`) with a 1px divider,
      44px targets on a 6px rhythm, 20px glyphs, active = solid square pink
      field + white glyph. The field is one shared layout pill that travels
      between Home/Search/Saved/Stats/Info on `spring.moderate` (0.16s) —
      the FF sidebar's row-to-row glide, adapted to the icon rail.
- [x] **Header: FROZEN (user).** The Persona-5 ribbon / lockup / day-picker
      composition is intentional; do not restructure, respace or restyle it.
- [x] **Detail = SaaS card shell** (user override of §18-A for this view):
      one header card + one opportunities card on the panel surface. Title
      gets the full card width so long names wrap to ≤2 lines; meta chips
      and icon actions share one hairline-divided row.
- [x] **Detail actions are icon-only:** Bookmark / Share / Close at 28px
      with `aria-label` + `title`; no text descriptions in the row.
- [x] **Live card = 5s carousel.** `lib/happening-carousel.ts` owns the deck
      (which session, live state, progress, up-next) so mock or alternate
      data is swapped there, never in the JSX. Auto-advances every 5s, off
      under reduced motion. Hover-expand stays reverted. The NE "show on
      map" button is gone — the card's title block now **opens the session's
      company detail**; Bookmark is the only secondary action. A small
      segment index at the bottom shows deck position, the active segment
      filling over the 5s interval.
- [x] **Help placement:** Help sits directly under Stats in the rail (the
      bottom-pinned spacer is gone).
- [x] **Home is the first state:** clicking Home clears a booth detail and
      any search query before switching tabs, so the rail can always exit
      detail.
- [x] **Search field demoted again:** desktop 32px tall, 1px border,
      13px text/16px icon, field fill at 30% (`bg-field/30`); placeholder
      copy cut to `Search` (no more "company, role, booth…").
- [x] **GIK → venue:** the Hall C1 card now leaves the GIK overview and
      lights the venue's Career Expo tab (booth selection already did this
      via `selectBooth`).
- [x] **Detail media slot:** 56px cover strip with the grey gradient
      skeleton (real logo via `company.logoUrl`). The booth code badge moved
      into the strip (bottom-left), and Bookmark / Share / Close are inline
      icon actions on its right edge — the title keeps the full width.
      Eyebrow shrunk to 11px.
- [x] **One list anatomy:** `.section-label` + `.panel-list` (11px label,
      1px panel border, hairline-divided rows) now used by search results,
      the venue list, Saved, Help and Stats. No more per-row card boxes.
- [x] **Stats — Swift Charts direction:** one boxy bento panel: the 2×2
      stat cells and the KPI tiles share the same hairline grid (the
      "Openings" section label is gone; "Your Bookmarks" shortened to
      "Bookmarks"). 24px values, 11px muted labels, hairline + two grays.
      Hovered chart points can no longer resize a cell: the value has a
      fixed `min-w-[4.5ch]` and tabular numerals, and the label/chart rows
      have fixed heights. The sector bars use a Swift-Charts-like
      categorical palette (blue / teal / orange / violet / rose / cyan).
- [x] **CTA: white → accent pink.** Reverted the neutral fill per user:
      white at rest, the page's pink accent wipes in from the left on hover
      (300ms in / 150ms out), instant on keyboard focus.
- [x] **Map tooltip rebuilt** for the visitor's actual question: a cover
      strip (the same grey skeleton as the detail card) above the title,
      then title (company / event), session line, hour, booth-code chip
      (zone colour), track tag. No side accent, no `shadow-xl`; neutral
      pointer.
- [x] **GIK_ZOOM:** now **18.3**. The DEV tuning panel was removed on
      request; use `__icdMap` in the console if a camera value needs a check.
- [x] **Help = bento layout:** venue tile (wide) + Google Maps action,
      hours tile, what-to-bring checklist tile (items split out of the
      paragraph, pink check marks, dress-code note), help tile (wide).
      Typography is now importance-scaled: 11px uppercase eyebrow, a Priego
      bold key fact (venue `GIK`, hours `08:00 – 17:00 WIB`), then 12px
      Poppins description. `ui.json` gained `mapsCta`, `mapsQuery`,
      `headlines`, `whatToBring.items/note`.
- [x] **CTA content colour:** label + arrow tile now flip to page white
      while the pink fill is under them (150ms), and on keyboard focus.
- [x] **Stats dev fixtures:** `useKpiData` returns mock KPI items (value +
      delta + trend) under `import.meta.env.DEV`; prod stays empty.
- [x] **Sector distribution:** Insights counts company tags (Tech / FMCG /
      …), top 6, as **horizontal Swift-style bars** with the categorical
      palette and no rotated labels (the 45° version was reverted). `useMemo`
      over the static company list — one pass per mount, and the island only
      mounts when the Stats tab opens, after the map has painted.
- [x] **Sidebar hairline dividers:** full-width 1px `#232326` rules under
      the header, search and live-card regions (Tailwind-homepage style),
      so the content column reads in bands instead of one stack.
- [x] **Registration menu:** the two entry points sit in a black bordered
      panel at the map's bottom-right on desktop (and at the top of Help on
      mobile). Rows scaled up to 48px/13px, plain arrow glyph (no bordered
      tile), white → pink wipe retained.
- [x] **Rail width:** 72 → **64px**, 44px targets unchanged.
- [x] **Map camera values:** `HALL_CENTER` = `110.376329, -7.774125`
      (Career Expo framing); the desktop Hall-card focus uses
      `110.376266, -7.774241` (`DESKTOP_FOCUS_CENTER`).
- [x] **Skeleton shimmer:** the boot/detail/tooltip skeletons now share one
      `.skeleton-shimmer` (moving grey gradient), replacing the opacity
      pulse.
- [x] **Booth glow wave:** a third, fill-less low-alpha ring expands outside
      the zone ring + black gap, so the pulse reads as a wave instead of a
      neon halo.
- [x] **Clickable facilities:** Entrance, Registration, Interactive, Photo
      Wall, Information Center and Panggung are now buttons on the plan
      (pointer/keyboard, hover pulse). They open `FacilityDetail` — one card
      with a bento explanation inside it — in the sidebar or the 30% mobile
      tray, with a star save placeholder and a white close icon. Empty map
      clicks and Home close it.
- [x] **Detail consolidation:** BoothDetail is one card now — cover, title,
      meta/tags, CTAs, feedback and openings all inside, with padding and
      hairlines instead of separate boxes. Actions are borderless and
      larger (18px icons, 20px white X). The eyebrow is a pink Priego label
      block (Jelajahi Denah treatment, not rotated).
- [x] **Openings hierarchy:** programmes group by contract type (Full-time /
      Internship) with counts, and one fluid-hover highlight glides across
      the rows like the search list.
- [x] **Rail + panel sizing:** rail 64 → 56px, buttons 40px, icons 18px;
      desktop panel 360/390 → **400/430px** so content gets room.
- [x] **Quick find:** pill chips with padding, filled icons, keyboard caps
      removed.
- [x] **Header divider art:** tick-mark hairline replaces the plain border;
      the lockup and date are untouched.
- [x] **Glow:** two soft fill-less layers (70% + 20%, the outer wider) with
      no hard stroke; facility markers pulse the same way on hover.
- [x] **Fourth KPI chart:** “Internships” fills the empty bento cell, and
      each sparkline now has its own categorical accent.
- [x] **Reveal system:** the vendored `.reveal-*` CSS is wired —
      `reveal-product` on the sidebar's search/live/list stack (header
      excluded) and `reveal-items` on venue/saved lists and the Insights
      and Help roots. No CLI reinstall: the classes were already present in
      `global.css`.
- [x] **New denah data (Figma nodes 2032:22592 / 2034:22847 / 22840 /
      22831):** companies, booths, zones and sessions replaced with the
      latest participant list (25 booths: A, C1–C6, D1–D4, E1–E14). Zones:
      C green, D pink, E orange, A teal. Legacy map SVGs copied to
      `*-legacy.svg`; the hull is untouched per "only the inside changes".
      B and E15 removed; D1/D2/D4 added; sessions remapped to live
      companies.
- [x] **Denah carbon-copy pass (Figma 2038 + 2041 + 2047:28177):**
      the **hull + pillars are the exact Figma SVG export**
      (`hall-pillars.svg`), placed by a similarity transform that maps its
      long right edge onto the old sprite's right edge (760.6,181.9 →
      454.6,786.9): scale 0.1909, rotate +18.3°, translate 265.3/−95.3.
      D1–D4 are the codegen slabs at **0.6×** (80/79/75 × 26px, 1.6px white
      border, Inter Bold 16 black, D1 -52.69°, D2–D4 -90°). Booth codes Inter Bold (D/E dark,
      C/A white); A caption **“CAREER STAR”** Priego; Photobooth / Entrance
      / Registration / Photo Wall Priego Bold white. Information Center
      marker deleted. Selected frame = `color-mix(bg 40%, #3a2416)`.
- [x] **No click glow:** selecting a booth draws a static dark-brown frame
      (6px); the pulsing glow and facility hover pulse are gone.
- [x] **Fixture sprites + GEOM editor (Figma 2063:22749):** toilet (5
      stalls), mushola (2), panggung platform, horseshoe/tapal-kuda island
      and the 80-seat grid are real SVG sprites (`toilet.svg`,
      `stage-seats.svg`, `panggung.svg`, `horseshoe.svg`, `seats.svg`).
      `PLAN_SPRITES` is the shared frame-space source of truth; the DEV-only
      `GeometryEditor` draws the same sprites over a paper hull, supports
      drag / numeric rotation / shift-group / scale handles, and exports
      booths + banners + sprites + annotations as JSON. The old hand-drawn
      Toilet/Stage/Seat polygons were removed because the real sprites now
      occupy those positions.
- [x] **Line pass + door glyphs:** C1–C3 and C4–C6 are aligned as two
      separate lines (C2/C5 midpoints), E1–E3 as one line (E2 midpoint),
      E4–E5 kept as their own pair; hull moved to `247.4/−105.7`. The
      entrance/exit doors are the **exact Figma vectors** from node
      `2086:22760` (`door-glyph-2086-22757.svg` and
      `door-glyph-2086-22758.svg`); the established entrance arrow
      (`arrow-entrance.svg`) is kept. The yellow arrow from node
      `2087:22763` (`arrow-yellow-2087-22763.svg`) is imported **twice**;
      the extra large top door and the invented double-door/door-arrow
      sprites were removed.
- [x] **DEV SVG picker:** every overlay SVG (`hull`, all `PLAN_SPRITES`,
      and the remaining speaker-dots B) carries `data-svg-id` /
      `data-svg-name` / `data-svg-src`. The picker is DEV-only and restored
      by default: click any SVG to read its name/id/tag/class/src, copy its
      id, then hide or restore it. Production builds never mount it.
      Hidden ids persist in `localStorage` (`icd:hidden-svgs`).
- [x] **Hull-parented editor:** changing the hull transform applies the
      same similarity delta to every booth, label, sprite, and annotation,
      so the hull can be moved/scaled/rotated as one unit. `dots-b` moved
      into `PLAN_SPRITES`; `pin-a`, `pin-b`, `dots-a`, `arrow-info` and
      `arrow-info-2` were removed from the overlay.
- [x] **Grey splash + PixelTransition:** the Figma illustration was
      discarded. The map loader is a grey skeleton surface with the real
      header lockup centred; the **Jelajahi Denah** ribbon runs a reverse
      CTA wipe (pink → white) with the text flipping to black while the map
      reports ready. `PixelTransition` (randomised mask) reveals the live
      map; the sidebar gets a server-rendered skeleton until hydration, and
      the track switcher / quick find / mobile rail reveal after the splash.
- [x] **Mobile chrome/UX pass:** the track switcher returns as a
      **vertical left rail** on mobile; the filter trigger now matches the
      search field chrome, the filter popover is smaller + scrollable and
      sits above the list; the info rail item is grouped with the main nav;
      bookmark/share actions share one aligned container; the sector bars
      are one undivided chart with FF stagger; the active venue uses two
      inherited-colour pulse rings (Pulse-inspired, 0/0.6s); the map tooltip
      drops the skeleton and its pointer bobs; QuickFind opens
      Toilet/Mushola/Help Desk details (copy in `facilities.json`); GEOM and
      the SVG picker are DEV-only buttons.
- [x] **Facility focus + registration CTA:** selected facility markers
      pulse with an inherited-colour fill and a bouncing guide arrow;
      QuickFind and marker clicks fly the map to the facility point.
      Registration now has a large map tooltip plus sidebar CTA with
      UGM/non-UGM register links. Map tooltips are scaled up. The splash
      uses `Shuffle` on Jelajahi Denah, the Figma basemap WebP, grey
      PixelTransition tiles with pink two-sided edges, and a single large
      sidebar-card skeleton. GEOM (hull-parent drag) and SVG picker buttons
      are restored in DEV.
- [x] **Hull re-fit + cleanup:** hull moved to `242.5/−76.2` with all
      booths/labels/sprites/annotations following the latest export.
      `dots-b` removed from the plan + delete from `public`; map clicks now
      clear `selectedFacilityId`; facility banner labels read from
      `facilities.json` (photobooth copy is data too); compass is a simple
      pink/white triangle; map tooltips scaled up; facility pulse uses
      inherited-colour fill with a blinking guide arrow.
- [x] **Header/rail polish:** Jelajahi Denah + UGM lockup nudged right;
      tick-stripe divider removed (plain hairlines only, plus more of them
      under section labels and above Help); rail 56px with a hairline
      separator.
- [x] **Search + quick find:** mobile-only frost on the field, the pink
      global focus ring suppressed on the search input, quick-find pills
      downsized again on mobile with more gap.
- [x] **Mobile chrome/sheet:** track switcher hidden on mobile, full sheet
      can open to ~92%, list scrolling moved to FF ScrollArea, and selecting
      a venue/facility now **lowers** the tray to the 30% detail height.
- [x] **Search facets (filter button):** a Sliders icon sits beside the
      search field. It opens an origin-aware popover (right-top origin,
      0.95 → 1 + fade, `spring.moderate`, faster exit) with two simple
      groups — **Sector** (company tags) and **Role** (opening types) —
      derived once at module load. Outside click / Esc closes, focus enters
      the panel and returns to the trigger, an active-count badge sits on
      the button, and Home clears the facets. `VenueList` applies them to
      the results branch (works with or without a text query).
- [x] **Quick find placement + scale:** moved from the desktop bottom-left
      float to directly under the track switcher at both breakpoints. Chip
      icons simplified (MoonStar for the prayer room, LifeBuoy for Help
      Desk, plain glyphs — the framed mini-circle is gone). Desktop chips
      are 28px tall / 11px text; mobile chips are ~15% smaller (20px / 9px)
      and use the same `rounded-md` as desktop instead of `rounded-full`.
- [x] **Track tabs — connected strip:** the switcher now follows the
      shadcn/FF tab styling: square triggers with 1px dividers, active fill
      (`#1c1c1c`) spanning the whole expanded tab, and a 2px pink bar on the
      bottom edge. Mobile label-expand behaviour is retained.
- [x] **Mobile sheet:** detail tray capped at **30%** of the viewport (was
      a fixed 320px), tab switches raise to that height, closing detail
      lowers to peek, and the scroll container was split from the
      `@container` wrapper (min-h-0 + explicit `touch-action: pan-y`) so the
      list scrolls again.
- [x] **Compass:** custom dial (ring, cardinal ticks, pink north needle).
      The needle rotates by `-map.getBearing()` via an imperative DOM write
      on the map's `rotate` event — remember that bearing is clockwise from
      north, so bearing 90 puts north on the left. Reset still animates to 0.
- [x] **CTA elsewhere in the map:** the Google Maps link in Help uses the
      same white → pink wipe and white content flip as the booth CTAs.
- [x] **State map:** `docs/map-state-map.md` records fields, derived view
      state, transitions, URL mapping, invariants, gaps and the test matrix
      (map page only).
- [x] **Registration entry points:** `data/ugm-icd-2026/registration.json`
      drives two links — **Daftar UGM** (Simaster) and **Daftar Non UGM**
      (mitra.simaster). Desktop: a floating pair over the map, bottom-right,
      outside the sidebar. Mobile: a stacked pair at the top of the Help/Info
      tab. Both reuse the white → pink CTA wipe.
- [x] **Map-page layout tidy-up:** islands under `src/islands/map/`, map
      hooks under `src/hooks/map/`, map utils under `src/lib/map/`, KPI
      component under `src/components/map/kpi/`; imports rewired, no logic
      changes.
- [x] **GIK intro tuner (DEV):** plain-Astro panel at top-right with a
      zoom slider, live map-zoom readout, Preview / Copy / Reset. Writes
      `localStorage['icd-gik-zoom']`, which `resolveGikZoom()` reads in dev
      (init + GIK tab), so a tuned value survives reloads until it is pasted
      into `GIK_ZOOM`. `window.__icdGik` exposes the intro center.
- [x] **Arrow icon:** the Hall C1 card now uses Lucide `MoveUpRight`
      instead of `/images/arrow-ne.svg` (asset now unused).
- [ ] Map SVG cohesion follow-ups (safe subset shipped: `#f6f6f6` whites,
      black Info Center text on yellow, Poppins booth codes,
      `shape-rendering: geometricPrecision` on every asset): decide on
      2× supersampling vs a MapLibre image source for the floor plan,
      unify the plan type family (Poppins / Sora), move the 80 seat dots
      into one SVG, and tokenize the banner colours.
- [x] **Plan surface pass:** removed the white booth borders (now a 1px
      dark hairline, crisper under resampling), dropped the hall slab's
      drop shadow, raised the hall fill to 90% so the **room** is the light
      anchor on the granite, replaced the blurred booth glow with a crisp
      double ring (zone colour + black), and enlarged the live dot to 10px.
- [x] **Two-font system:** Priego (headings) + Poppins (everything else) as
      tokens; the Google Fonts link loads Poppins 400–700 only. Sora and
      Inter are gone from the map surfaces; `--font-inter` remains a legacy
      alias to Poppins.
- [x] **Floor-plan memoization:** the overlay now subscribes to
      `hoveredBoothId`/`selectedBoothId` only (no whole-store render), and
      the static art tree is built once with `useMemo` — hover/selection
      re-renders just the booth chips.
- [ ] Raster performance (deliberately NOT implemented yet): 2× supersample
      costs 4× raster pixels and re-raster on zoom settle; the MapLibre
      image-source route adds GPU filtering but loses DOM styling. Decide
      after profiling, not now.
- [x] **Map boot overlay:** server-rendered in `map.astro` so it paints
      before the island hydrates and covers the **whole map sheet including
      the chrome** (the island's own skeleton was trapped by its stacking
      context). FF-surface breathing gradient + faint grid, a 42px map icon
      above a Priego-grey “Map is loading” line. Lifts on the first `idle`
      frame (3s island fallback, 6s no-hydration fallback), fades 500ms.
- [ ] Verify long-name wrap at 360/390px, the CTA wipe on a real pointer,
      the carousel cadence, mobile list scrolling, and the compass after a
      two-finger map rotation.

### E. Mobile screenshot pass — next sprint

- [ ] Rework the narrow top-control band shown in the supplied mobile
      screenshot: keep Search visually primary, give the filter control a
      clear separate hit area, and prevent the quick-find chips from feeling
      crammed against the search row or map chrome.
- [ ] Check the layout at 320 / 360 / 375 / 390 / 430px widths. No clipped
      search text, wrapped/overlapping controls, or registration/map labels
      obscured by the top controls.
- [ ] Preserve the current Persona 5-inspired dark/pink art direction and
      map-first composition. Solve the hierarchy with spacing, sizing, and
      grouping before adding another component library.
- [ ] Keep quick-find chips visually compact but give each a reliable
      44px-effective touch target; verify tap accuracy and separation from
      map pan/zoom gestures on real mobile hardware.

### Acceptance
- [ ] Screenshots 375 / 768 / 1440; sidebar reads as ONE surface with
      dividers; the dominant element matches the table above per view.
- [ ] Console clean; typecheck green; `graphify update .` after.

---

# PARKED (backlog — see docs/BACKLOG.md)

> AGENTS.md rule: dev server, typecheck, lint, and builds run **inside the
> container** (`docker compose -f docker-compose.dev.yaml exec app npm run …`).
> Static file edits happen on the host.

---

## 0 — P0: Fluid Functionalism wiring (top priority, per user)

The stack read showed the full FF library (base flavor) is **already
installed** — `use-fluid-hover`, `scroll-area`, `size-context`, `springs`,
`type-scale`, `font-weight`, `key-cap` — but **no custom island imports any
of it**. Do not re-install; wire + repair.

- [ ] Write `PRODUCT.md` from the confirmed init interview — **DONE** (this
      repo root). Commit it before visual work starts.
- [x] One-time stack repair — DONE: `components.json` written by hand
      (Tailwind v4 + `@/` alias, new-york); registry installs verified
      working (`reveal.json` pulled non-interactively). Palette mapped onto
      shadcn/FF theme tokens in `global.css @theme` (background/foreground/
      primary/border/muted-foreground/hover + the 8-level surface ladder).
      `MotionConfig reducedMotion="user"` wraps every island root via
      `MapFluidRoot` (islands are separate client:only React roots — a
      BaseLayout provider would wrap nothing). Registry quirk fixed: the
      CLI rewired skeleton.tsx to an npm `cn` package — reverted to
      `@/lib/utils` and the dep removed.
- [x] Wire `useFluidHover` + `FluidHoverHighlight` (one gliding highlight
      per list, replacing per-row hover classes):
      - `VenueList` booth rows — flat indices across zone groups; pink
        inset bar is selected-only; keyboard focus calls `setActiveIndex`.
      - `MapSidebar` icon rail — axis y; active state fixed (white icon +
        2px pink left rule, `#333` gliding highlight).
      - `MobileBottomSheet` tab rail — axis x.
      - `TrackSwitcher` pills — axis x.
      - `QuickFind` chips — gliding fill (user decision over ring).
- [x] Replace `overflow-y-auto` in the sidebar scroll region with
      `<ScrollArea viewportClassName="scroll-fade">`; `TrackSwitcher` strip
      → `<ScrollArea orientation="horizontal" viewportClassName="scroll-fade-x">`
      (the `[scrollbar-width:none]` hack is gone).
- [x] Size ladder: `MapFluidRoot` mounts `FluidProvider size="compact"` —
      the SizeProvider step wraps every island subtree; FF components
      (ScrollArea, KeyCaps, highlight) inherit the 28px step.
- [x] Motion tokens — MOVED to §14: spring tokens are `motion/react`
      configs; the current animations are CSS transitions, so consuming
      them is §14's refactor, not §0 wiring.
- [x] Shortcut caps: SearchBar uses `KeyCaps` (default tone — FF's
      `inverted` assumes a light theme bg). QuickFind's inline kbd stays
      local on purpose: an 18px cap would bloat the Figma-sized chips
      (visual integrity rule).
- [x] Record DECISIONS — `docs/PRODUCT.md` (type rules local to map
      islands; pink #ff2d6f; KeyCaps tone; §0→§14 motion move; shadcn
      deferred→done; QuickFind fill).

## 1 — P0: Responsive spine

- [x] Move the desktop/mobile switch from `sm:` (640px) to `md:` (768px)
      everywhere in the app surfaces: `map.astro` sidebar/quick-find/sheet,
      `MapSidebar` rail, `MapLibreMap` control rails + both `matchMedia`
      checks, `TrackSwitcher` pill padding/size, `SearchBar` Ctrl+K hint,
      Insights grid. Remaining `sm:` usages live only in FF-vendored
      generic components (not map surfaces).
- [x] ~~Add a compact mobile header to `MobileBottomSheet`~~ — **DELETED
      (user decision): no brand header on mobile, it clutters the viewport.**
      The brand lockup returns later as a View Transitions shared element
      during the skeleton/map-loading pass (§16-C) — it "sweeps" into the
      map, it never becomes a header. Mobile day switching is still
      unsolved → tracked in `docs/BACKLOG.md` (prompt the user before
      implementing; a sheet-internal day control is the likely shape).
- [x] Replace magic-number couplings:
      - Hall card's mobile offset now derives from the sheet's exported
        `SNAP_PEEK` + `TAB_RAIL_H` constants (was hard-coded 172px).
        `bottom-[178px]`/`top-[64px]` from the audit no longer exist in
        code (stale after the chrome repositions).
      - Map tap on empty space now deselects → the tray lowers back to
        peek; booth tap still raises it to half (user-requested flow).
- [x] Container queries: `Insights` KPI grid (`@[20rem]:grid-cols-2`) and
      `BoothDetail` CTA row (`@[18rem]:grid-cols-2`) respond to the
      sidebar/sheet width (`@container` on both content regions), not the
      viewport.

## 2 — P0: Color tokens that guide the eye

- [x] Reconcile pink to one value (`#ff2d6f`) — done: `DESIGN.md` fixed,
      FloorPlanOverlay/MapTooltip/MapLibreMap glow/booth-pulse fallbacks all
      use `#ff2d6f` / `var(--accent-pink)`.
- [x] Hex collapse **respecting the FF Surfaces system** (partial, by
      design): the ~13 most frequent fills are ROLE tokens now (`bg-card`,
      `bg-chip`, `bg-chipfill`, `bg-field`, `border-line`, `bg-cardbg`,
      `text-ink-dim/muted/body` — 1:1 with the Figma hexes, zero visual
      change); elevation uses `surface-1..8`. Remaining one-offs
      (`#0c0c0f` sheet, `#0a0a0a` strip, `#1d1d1d` sidebar, rail grays)
      collapse in a later pass — they're single-use, so no inconsistency
      today.
- [x] Accent discipline (this pass):
      - Yellow keeps ONE meaning: the live card's yellow border is gone
        (neutral `border-line`); `#f5b400` remains only on the countdown.
      - Rail active state got the pink treatment (§0).
      - Zone-colored booth-code chips per list row (DESIGN.md's
        wayfinding unit) — zone identity moved off the `borderTop` strip
        (§8 remediation) onto the chips.
      - Primary CTA stays white = destination.
- [x] Contrast fixes: search placeholder lifted to `#d4d4d8`, Insights
      subtitles `#71717a → #a1a1aa`, booth count `#5f5f5f → #8f8f8f`,
      share feedback `#bbb → #d4d4d8`.
- [x] Hover gating: one `@custom-variant hover` override gates EVERY
      `hover:` utility behind `(hover: hover) and (pointer: fine)` — touch
      devices stop latching hover states.
- [x] Focus-visible: pink 2px ring globally on interactive elements.

- [ ] Ladder implementation = FF Surfaces system (vendored `Elevated` /
      `surfaceClasses`; the 8-level `surface-1..8` + `shadow-surface-1..8`
      tokens now live in `global.css @theme`). Migrate the hard-coded hexes
      onto it: `Elevated offset={2}` for dropdowns/popovers, offset 4 for
      dialogs, `surfaceClasses(n)` for non-div elements. Applied so far:
      TrackSwitcher dropdown (level 3), Hall C1 card (fixed level 3).
      Frameless chrome (QuickFind chips, track strip) stays surface-less by
      design — Google-Maps-style standalone pills, no box-in-a-box.

## 2.5 — P0: Breathing room (spacing as hierarchy)

User report (Nov 22 screenshots): the desktop sidebar reads **cramped**, and
the split between the icon dock (rail) and the content column is muddy —
`#262626` rail against `#1d1d1d` content (`MapSidebar.tsx:85,127`) are two
near-identical grays propped apart by a heavy `border-r-2 border-black/40`
instead of real surface separation. This section is the spacing layer under
§9's IA eye-flow: §9 decides WHAT dominates; this decides the air that makes
the dominance legible.

Principles (Emil / impeccable):

- **Proximity = hierarchy.** Related things sit tight; groups are separated
  by clearly MORE space than the gaps inside them. Today the ratios barely
  differ (4–12px within groups, 8–16px between), so nothing visually groups.
- **Spacing replaces chrome.** Every border/box removed in the §2 boxiness
  pass must have whitespace doing the same job in its place — the two passes
  land together or the page reads both cramped and naked.
- **One rhythm, not per-component guesses.** An 8px base scale; IA groups
  step at 24/32px. No more `pb-3` vs `pt-3` vs `pb-4` one-offs.

### Rail ⇄ content distinction (the "huh" fix)

- [x] **Depth via border, not a second surface (user decision, Nov 23):**
      rail and content share `#1d1d1d`; separation is the 1px `#2a2a2a`
      divider plus the 16px gutters. The heavy 2px black/40 border is gone
      from both the rail and `map.astro`'s `<aside>`.
- [x] **Rail breathing (user decision):** 44×44 targets, one 6px gap
      rhythm (`gap-1.5`), 20px icons (was 22px), 56px top / 20px bottom
      padding. Labels were dropped by the user — icons stay label-less.
- [x] **Rail active language — solid pink field + white glyph** (user,
      Nov 23): replaces `#3b3b3b` + the 2px pink side rule. The field is a
      shared `layoutId` pill that glides between sections on the FF
      sidebar's `spring.moderate` (0.16s, critically damped), snapping only
      on reflow; zero corner radius (user). No side accent anywhere in the
      rail; the fluid-hover glide stays for idle hovers.

### Content column rhythm

- [ ] ~~Header: extend §6's header-grid item~~ — **FROZEN (user, Nov 23):
      the Persona-5 header is intentional and must never be restructured.**
      Only the content column below it is in scope for spacing work.
- [ ] One vertical scale for the column: 8px between related lines,
      16px inside a card's padding zone, **24px between IA groups**
      (search → live card → venue list). Retire the current mix
      (`px-3.5 pb-3`, `pb-4 pt-3`, `pb-6 pt-2` at `MapSidebar.tsx:193–205`).
- [ ] Group separation without lines: 24px + the section label separates
      groups; never a divider AND a big gap. In `VenueList`, 8px inside a
      zone, 20–24px between zones, so each zone header owns its rows.
- [x] Amend §4's gutter token: sidebar gutter 14px → 16px (`px-4`) across
      search, live card and the scroll region; sheet stays 16px. No
      `px-3.5` stragglers left in the sidebar.
- [x] Width before density: `map.astro` now uses the 360px step at md and
      390px at lg, so 768–1023px screens keep more map.
- [x] §6's search-bar slimming: desktop 42 → 32px height, 3 → 1px border,
      text 15 → 13px, icon 20 → 16px, field fill at 30% — the freed height
      goes to the header band's air, not to more content.

### Verify

- [ ] Squint test at 768 / 1440: the three IA groups (live card, search,
      list) must read as three islands, and rail vs content as two planes —
      screenshot pass alongside §9's.

## 3 — P1: Type scale

- [ ] Define 5–6 type tokens (`--fs-label 11 / --fs-caption 12.5 /
      --fs-body 13.5 / --fs-subhead 15 / --fs-title 19 / --fs-display 44`)
      and migrate the ~20 arbitrary px values. `src/lib/type-scale.ts`
      exists but is unused — extend or replace it; keep Figma styling.
- [ ] Unify section labels to ONE pattern (currently three): `font-heading,
      11px, semibold, uppercase, tracking-[0.08em], #8f8f8f` —
      `VenueList`, `.sidebar-section-title`, `Insights`.
- [ ] Badge sizes: one size (12px, `py-0.5 px-2`) across `BoothDetail` /
      `BookmarkList` / tags.
- [ ] Bump content-bearing `text-[10px]` (Insights subtitle, stat labels)
      to 11–12px; 10px stays for true footnotes (attribution, kbd caps).
- [ ] Round Figma-export precision (`text-[15.531px]` → `15.5px`,
      `tracking-[-1.2425px]` → `-1.24px`) in `FloorPlanOverlay`.

## 4 — P1: Spacing & touch targets

- [ ] One map-edge inset rule: 16px desktop / 12px mobile. Currently
      track switcher `left-4`, quick-find `left-3`, venue card / zoom rail
      / attribution `right-3` disagree.
- [ ] 44px touch targets: `BoothDetail` header buttons (`p-2` ≈ 34px),
      `VenueList` bookmark, mobile tab rail `h-10 w-10` → `h-11 w-11`.
- [ ] Fold off-grid one-offs to the 4px scale: `py-[7px]`, `h-[33px]`,
      `gap-[7px]` — unless the Figma spec pins them (verify against Figma
      before flattening).
- [ ] One gutter token per context (sidebar 16px, sheet 16px); stop mixing
      `px-3.5` / `px-4` within the same role.
      - [x] Sidebar gutters unified to 16px (`px-4`) in §2.5; the token is
        now in use across search / live card / scroll region.

## 5 — P2: Sweep

- [ ] 10px footnote audit (attribution, kbd hints) — keep or align.
- [ ] Remove dead styles, debug leftovers, and any polish churn at the end
      (source diff pass).
- [ ] Run the mechanical detector once UI is finished:
      `impeccable detect --json --changed` (manual — no hook active).

## 6 — Layout de-clunk (from Nov 21 screenshots)

### Desktop


- [ ] De-densify the live-session card: keep ONE accent (pink hard
      shadow), demote the yellow border to the countdown only, merge the
      two meta rows into one line, footer row into the card's bottom edge
- [ ] Fix map chrome collisions: move zoom/compass rail clear of the E/F
      label band (hug the right edge below the Hall C1 card), lift
      quick-find off the bottom edge (it clips), separate attribution


### Mobile
- [ ] Reorder sheet content: map + live session first; search lives in the
      Search tab (it already exists) — peek shows tab rail + live card,
      not a search field
- [ ] Snap the peek to a content boundary: peek height = handle + tab rail
      + live-session card header, so the card never beheads
- [ ] Track switcher: full-width ScrollArea with scroll-fade-x so
      "Career Counseli" truncation gets a fade cue, not a hard cut
- [x] ~~Add the mobile day-picker/brand header~~ — deleted with the §1
      item (no brand header on mobile); day switching tracked in
      `docs/BACKLOG.md`.

## 7 — Fluid Functionalism rules on remaining surfaces (explicit, for later)
- [ ] Scroller rule: FF ScrollArea + scroll-fade / scroll-fade-x on EVERY
      scroll container — sidebar list region, sheet content scroller,
      TrackSwitcher strip (replaces the [scrollbar-width:none] hack);
      native scroll preserved on touch
- [ ] Motion rule: replace hand-written durations with spring tokens
      (@/lib/springs) across: sheet snap animation (350ms CSS height →
      spring or FLIP per custom-motion.md), TrackSwitcher dropdown
      (150ms), tooltip (150ms), day-picker chip transitions, KpiTile
      value/sparkline animation; exits use the paired .exit tween
- [ ] Icon-swap rule: rail Info/CircleHelp toggle crossfades in one grid
      cell instead of a conditional render swap
- [ ] Weight-without-reflow: selected/active labels (tab pills, day
      numbers) use the ghost-span fontWeights pattern instead of
      font-bold swaps that nudge layout
- [ ] Verify MotionConfig reducedMotion="user" wraps all of the above

## 8 — One-sided accent hunt (AI-slop tell: "bottom/side-only color accent")

The detector (regex mode) only fires Inter; the element rules
(`border-accent-on-rounded`, `side-tab`, `hard-offset-shadow`,
`edge-flush-cards`, `gpt-thin-border-wide-shadow`) need a rendered scan.
Manual sweep found the real problem — **four different one-sided accent
orientations used as the hierarchy device across unrelated components**
(left bar, top strip, bottom underline, right border). The inconsistency is
the slop tell; one accent system is the fix.

### Inventory (file:line)

| Where | Today | Orientation |
| --- | --- | --- |
| `VenueList.tsx:13–14` | `shadow-[inset_3px_0_0_#ff2d6f]` on selected + hover row | left bar, pink |
| `VenueList.tsx:145` | `borderTop: 3px solid ${zone.color}` on zone card | top strip, zone color |
| `TrackSwitcher.tsx:59` | `shadow-[inset_0_-2px_0_#ff2d6f]` on active pill | bottom underline, pink |
| `MapTooltip.tsx:20–22` | `borderRightWidth: 3px; borderRightColor: zone?.color` (+ arrow corner inherits it) | right border, zone color |
| `HappeningNow.tsx:125` | `shadow-[4px_4px_0_#ff2d6f]` + yellow 1px border | bottom-right offset shadow, pink+yellow |
| `MapSidebar.tsx:81` + `map.astro:14` | `border-r-2 border-black/40` on rail and sidebar | heavy 2px side border (structural, reads same family) |
| `MobileBottomSheet.tsx:98` | drag handle `h-1 w-10 rounded-full bg-zinc-700` | centered bottom pill (low priority — standard affordance) |

Not slop, do not touch: `global.css .booth-pulse` glow (functional map
selection state), `FloorPlanOverlay` zone fills (data-driven geometry).

### Remediation — one accent system

- [ ] **Pink left-inset bar = the single "selected/active" language.**
      - VenueList rows keep it (already correct).
      - TrackSwitcher active pill: bottom underline → same left inset bar
        (3px, pink, inside the pill).
      - ~~Sidebar rail + mobile tab rail active state: pink left rule~~ —
        **superseded Nov 23:** the desktop rail uses a solid pink field +
        white glyph (user decision). Mobile tab rail may still take the
        rule if it reads better at sheet scale.
- [ ] **Zone color = chips and fills, never strips.**
      - VenueList zone card: remove the `borderTop` strip; zone identity
        moves to the colored booth-code chips (already planned in §2) and
        the zone header row.
      - MapTooltip: **redesigned Nov 23** — no side accent at all. Identity
        row (logo / monogram), company or event title, session line, hour,
        booth-code chip carrying the zone colour, and a track tag (e.g.
        Career Counseling). Neutral pointer; the old right bar + arrow
        inheritance is gone.
- [ ] **Hard-offset shadow = HappeningNow only.** It's the Persona-5
      signature — keep it there as the ONE sanctioned offset shadow; other
      floating cards use 1px borders + the surface ladder (§2), not soft
      `shadow-lg`/`backdrop-blur` (see §2 boxiness item).
- [x] **Structural side borders: 2px black/40 → 1px `var(--border)`.**
      Done Nov 23: rail and `map.astro` aside both use `border-r` +
      `#2a2a2a`; the rail also shares the content surface color (user).
- [x] **Zone color strips removed:** the VenueList `borderTop` strip is
      gone. Zone identity rides the booth-code chips only. (The zone *card*
      itself is still a box — that is §18-A's flattening job, not an accent
      issue.)
- [ ] After fix: re-run the rendered scan for the element rules
      (`impeccable detect http://localhost:PORT` from the container, plus a
      390x844 mobile viewport pass) to confirm `border-accent-on-rounded`
      and friends are clean.

---

## 9 — IA eye-flow map: sizing + color guide the persona to the next step

Personas and their desired flow (from `PRODUCT.md`):

| Persona | Desired flow |
| --- | --- |
| **On-site student** (primary, phone, crowded hall) | arrive → "what's happening now" → find booth/company (search or list) → link zone color to map → navigate → go |
| **Pre-event planner** (desktop) | browse companies → bookmark → pick day/sessions (day picker) → arrive with a plan |
| **Remote visitor** | browse list → open booth detail → opportunities → website CTA |

The rule: **each persona's next step is the highest-contrast + largest
interactive element in view; everything else recedes.** Squint test — what's
pink, what's white, what's biggest should spell out the flow above. Today it
doesn't: the search bar (loudest), ribbon, day chip, and live card compete
at equal weight on arrival.

### Sizing ladder (enforce steps ≥3px between adjacent roles)

- [ ] One dominant element per viewport:
      - Sidebar (home): the **live-session card** is dominant (17px session
        title, pink accent) — it is the on-site persona's entry point.
      - Sidebar (detail): the **company name** is dominant (19px title,
        14px CTA row).
      - Map: the **Hall C1 card + track switcher** are the only elevated
        chrome; the floor plan owns everything else.
- [x] The search bar demotes from loudest to quiet-first-class: desktop
      32px height, 1px border, 13px text, 30% field fill — search is a
      tool, not a destination; the list and live card rank above it.
- [ ] Section labels (11px uppercase) stay small and gray — they name
      groups, never compete with content. Footnotes stay 10px.
- [ ] List rows: 13px semibold names; booth-code chips inherit the zone
      color at the SAME size — the chip is the wayfinding unit, not a
      decoration.

### Color as a breadcrumb trail (pink = the flow, in order)

Pink currently means 7 things at once. Give it ONE job per surface, placed
along the persona's path so the eye walks pink → destination:

1. Arrival: ribbon (brand moment) — the ONLY large pink block.
2. "Now": live-session dot + Next tag + card shadow (the on-site hook).
3. Choice: selected row's left bar / active pill / rail rule (§8 system).
4. Confirmation: day chip + selected booth's glow on the map (zone color
   where it's data, pink where it's state).
5. Destination: **white** CTA row in booth detail — the eye lands on the
   brightest interactive element only after the pink trail leads there.
- [ ] Audit every pink use against this order; anything pink that isn't
      steps 1–4 loses its pink (becomes gray/white).
- [ ] Yellow keeps one meaning: countdown (already §2).
- [ ] Zone colors appear ONLY at decision points: booth-code chips, zone
      headers, tooltip bar, map fills, glow — never as background fills on
      chrome, never two accent hues on one element (HappeningNow fix in §6).

### Per-surface reading order to enforce

- [ ] **Sidebar home (desktop):** live card → search → venue list groups.
      Live card sits above the list, full-width, only pink-accented card.
- [ ] **Sidebar detail:** booth chip (zone color) + company name → tags →
      opportunities (13px rows) → CTA row (white, 14px, full-width pair) —
      bottom-anchored so the destination is the scan's terminus.
- [ ] **Mobile peek:** tab rail + live card header only (§6) — the flow
      starts at "now", not at search; full sheet reveals the list.
- [ ] **Map:** track switcher (top-left) → Hall C1 card (top-right) →
      booth glow/tooltip (in-map). Chrome never outranks the plan.
- [ ] Verify with the squint/screenshot pass at 375, 768, 1440 — the
      dominant element must match the table above on every viewport.

---

## 10 — Tray, search escape, zoom bounds, state-machine audit

### Tray (mobile bottom sheet) geometry

- [ ] **Cap the tray at 50% of screen height.** `SNAP_FULL_RATIO 0.82` →
      `0.5` (`MobileBottomSheet.tsx:17`). The map stays visible while the
      tray is open — the map is the hero (§9). Consequences to handle:
      - Snap ladder rework: with the 50% cap, peek(110) / half(320) /
        full(50%) collapse into two meaningful steps on small phones
        (half ≈ full there). Re-derive snap points from the cap
        (peek / expanded = 50%), and make `SNAP_HALF` a fraction of
        viewport height, not a fixed 320px.
      - Reconcile the coupled numbers: `bottom-[178px]` control offset and
        the §1 magic-number items must follow the new geometry.
      - With less sheet height, §6's "snap to a content boundary" rule
        (peek = handle + tab rail + live-card header) becomes the primary
        expanded state — content may need to scroll within 50%.
- [ ] **Thumb-safe top zone on the tray.** The tray's top strip is where
      the thumb lands and drags:
      - Drag zone = full tray width, ≥56px tall (handle + slack), with
        pointer capture as today — not just the 32px handle row.
      - Tab rail buttons ≥44px targets (already §4) and ≥8px from the top
        edge / rounded corner.
      - No interactive control within the top ~8px of the sheet (content
        `pt` accounts for the rounded corner + handle zone).
- [ ] MobileBottomSheet is currently a hand-rolled gesture; when §0's FF
      wiring happens, keep the gesture but move easing to spring tokens
      (§7) — snap decisions re-evaluated on pointer up with velocity
      (already implemented — preserve it through the 50% rework).

### Search escape hatch

- [ ] **Clicking outside the search bar reverts to the home state.**
      Today typing flips `sidebarMode` to `'search'` and clearing the
      field is the only way back. Add an outside-click/blur handler
      (document-level, like TrackSwitcher's) while `sidebarMode === 'search'`:
      - Query empty → revert `sidebarMode` to `'list'` (home), Search tab
        included.
      - Query non-empty → keep results visible but drop active focus ring;
        Esc key ALSO reverts to home (keyboard parity), matching the
        Ctrl K entry.
      - Applies to both desktop sidebar and the mobile sheet instance.
      - Never traps the user in search: verify from every tab.

### Zoom-out overshoot

- [ ] **Zooming out goes too far** (user report: "made the number from 16
      to just 4"). Current camera bounds in `MapLibreMap.tsx:148–150`:
      entry `zoom: 16.3`, `minZoom: 14.5`, `maxZoom: 21.5` — zoom-out can
      fall ~2 levels below the entry overview, past the floor plan's
      comfortable frame (overlay gets tiny/warped, campus context drowns
      the plan). Fix: cap the zoom-out floor so the farthest out keeps the
      GIK hall framed — raise `minZoom` toward the entry zoom (~15.5–16.3,
      exact value confirmed on device); verify the SVG overlay homography
      holds at the new floor and that GIK camera mode + hall fit still
      work (lines 300, 344).

### Implicit / degenerate state audit (escape-proofing)

- [ ] Enumerate the real state space of `mapStore`:
      `sidebarTab × sidebarMode × selectedBoothId × selectedAreaId ×
      selectedDayId × searchQuery × isMobileSheetOpen × tray height × URL
      booth id × persisted bookmarks`. Persisted keys (persist middleware)
      restore on reload — list which fields persist and test a reload
      into each.
- [ ] Walk the matrix and flag every **broken, cyclic, or disjointed
      state** — known suspects to verify:
      - **No-escape:** Search tab with empty results and no visible back;
        booth detail on mobile with the close button outside the 50% tray
        or scrolled away; sheet at peek with content unreachable.
      - **Cyclic:** tab A → B → A losing scroll/selection; switching day
        resets area but keeps a selected booth from another day; track
        switch clearing the booth but not the URL.
      - **Disjointed:** sidebar shows a booth whose area isn't the
        selected track (map glow vs list mismatch); URL booth id for a
        booth in another venue/track restores half-applied state;
        `selectedAreaId` pointing at an area with no sessions for the
        selected day (HappeningNow empty vs card visible).
      - **Persisted stale:** reload with a persisted
        `selectedBoothId`/`sidebarMode` restored into a state whose
        context (area/day) no longer matches.
- [ ] Rule for every state found: **≥1 visible, reachable exit** (close,
      back, outside-click, Esc) and a store guard so transitions can't
      produce orphans (selecting an area clears incompatible booth ids;
      invalid URL ids fall back to home; day switch sanitizes selection).
- [ ] Add the matrix as a test checklist in `src/test` (setup exists) so
      regressions surface.

## 11 — Radius consistency + scrollbars on small widgets

### Border radius: 7 different values, no ladder

Tokens exist (`--radius-sm 4px`, `--radius-md 6px`) and the boxy aesthetic
is committed, but the code uses the full Tailwind spread:

| Value | Where it shows up |
| --- | --- |
| `rounded-sm` (4px) | rail buttons (`MapSidebar:90,107`), sheet tab buttons (`MobileBottomSheet:160`), KpiTile sparkline, SearchBar clear |
| `rounded-md` (6px) | ZoomButtons, CompassButton, MapTooltip, TrackSwitcher pills + items, QuickFind desktop |
| `rounded-lg` (8px) | Hall C1 card (`MapLibreMap:390`), TrackSwitcher bar, track dropdown (`TrackSwitcher:32,78`) |
| `rounded-t-xl` (12px) | MobileBottomSheet top corners (`MobileBottomSheet:117`) |
| `rounded-2xl` (16px) | **SearchBar on mobile** (`SearchBar:21`) — the roundest thing in the app on its most prominent control |
| `rounded-full` | drag handle, KpiTile delta badge + sparkline dot, QuickFind mobile chips + icon circles |
| FF shape system | installed FF components expect sharp (1px) or container 12/24 via `shape-context` — currently coexisting with all of the above |

- [ ] Define the ladder for the boxy/pixel world — **3 stops max**:
      `sharp (0–1px)` for surfaces/cards (list cards, dropdowns, sheet,
      Hall C1 card, tooltip), `--radius-sm (4px)` for controls (buttons,
      pills, inputs), `rounded-full` ONLY for genuinely round glyphs
      (drag handle, sparkline dots, icon circles inside quick-find chips).
- [ ] Kill the outliers: SearchBar mobile `rounded-2xl` → same as desktop
      (sharp/square per Figma); `rounded-t-xl` sheet top → sharp or 4px
      with a 1px top border; `rounded-lg` cards → sharp; `rounded-md`
      controls → `--radius-sm`.
- [ ] Reconcile with FF: set the project's shape-context so FF components
      render the same stops — never leave two radius systems visible at
      once (a 12px FF dialog next to a 4px island button is exactly the
      inconsistency this section kills).
- [ ] Nested corners where layers stack (dropdown inside switcher bar,
      list card inside sidebar): `inner = max(0, outer − inset − border)`
      via `shape-context`'s `nestedRadius()`.

### Scrollbars on small UI widgets

The global 5px custom scrollbar (`global.css`) applies to EVERY scroll
container — including tiny ones where it's clunky (a 236px dropdown, the
track switcher strip).

- [ ] Inventory every scroll container: sidebar list region, sheet content,
      track switcher strip, track dropdown (tall lists), BoothDetail
      opportunities, Insights.
- [ ] Small widgets (dropdowns, strips, chip rows): FF `ScrollArea` with
      `scroll-fade`/`scroll-fade-x`, or hidden overflow with the fade —
      never the raw global 5px bar. TrackSwitcher's
      `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` hand hack is
      replaced by §7's ScrollArea item.
- [ ] Main regions (sidebar, sheet) use ScrollArea so width/shape come
      from the shape system and the bar only paints while scrolling
      (scroll-fade), not as a permanent gutter.
- [ ] Touch devices: native scroll momentum preserved.
- [ ] Verify: no nested double scrollbars, no scrollbar on a widget
      shorter than ~120px, no layout shift on scrollbar appear/disappear.

## 12 — P0 bug: map turns black when clicking a venue (desktop)

User report: clicking a venue/booth from the sidebar sometimes turns the
whole map black on desktop (black canvas; the granite `#09090b` stage
behind it). The file itself documents the suspect family — the
"disappearing map" bug (`MapLibreMap.tsx` comments at 97–101 and 286–290:
`easeTo` padding sticks; a later `fitBounds` then aborts with
"Map cannot fit within canvas" and silently no-ops).

- [ ] **Reproduce & instrument.** Desktop, click venue/booth rows from the
      sidebar (repeatedly, after switching tracks). Watch console for the
      MapLibre fit abort; distinguish the two failure shapes:
      1. **Camera race (likely):** one sidebar click fires TWO camera
         moves back-to-back — the booth `easeTo` (`MapLibreMap.tsx:291–307`,
         zoom ≥19.4) and the venue-change `fitHall()` (`:313–325 → :94–119`,
         `fitBounds` padding 96). Overlapping `easeTo`/`fitBounds` on the
         same map can cancel/abort mid-flight; a later fit with clamped
         padding may still compute a negative free space at small map
         widths (768–1024px viewports: map ≈ 306–560px wide after the
         462px sidebar). Suspect the sidebar because that's where both
         triggers originate.
      2. **Canvas/GL loss:** verify the `.maplibregl-canvas` still exists
         and has size when black (DevTools) — if gone/0-height, it's the
         island/context path, not the camera.
- [ ] **Fix direction — single camera owner.** Queue all camera moves
      through one manager: cancel any in-flight `easeTo` before
      `fitHall()`; merge booth-fly + hall-fit into one move when both
      trigger on the same click (selectBooth sets booth AND area); add
      `map.on('error')` logging; clamp the desktop fit padding like the
      mobile clamp (`:106`) instead of flat 96.
- [ ] **Guard the resize path:** the sidebar/aside is `w-[390px]` fixed,
      but verify the map container never reports a 0/intermediate size to
      `fitBounds` during any sidebar state change (mode swaps, detail
      open) — ResizeObserver + `map.resize()` before fitting.
- [ ] **Add a regression case to the §10 state matrix:** booth select from
      list → verify map still renders (canvas painted, not black) on
      desktop 768 / 1024 / 1440.
- [ ] Note: `persist` only stores `bookmarkedIds` (`mapStore.ts:180`), so
      this is NOT a zustand-persist bug — "persisting" here = the black
      state persists until reload; fix makes recovery automatic.

---

## 13 — SPA link/anchor traversal → state & transition map

The app deep-links state through the URL (booth anchors via
`useBoothFromUrl`, plus venue/company/event links) — "tons of links to the
anchor". Every link is a state transition the store never sees directly, so
each one can produce a UI state the rest of the app doesn't expect. Before
polishing further, traverse them all and build the state/transition map.

- [ ] **Inventory every link and anchor entry point:**
      - URL/anchor params parsed by `useBoothFromUrl` (and anything similar
        for venue/track/day) — all accepted shapes, aliases, casing.
      - In-app navigators: VenueList rows, BookmarkList rows, search
        results, HappeningNow card, TrackSwitcher, Hall C1 card, map booth
        clicks/taps, quick-find chips, EventInfo links, BoothDetail CTAs
        (external), 404 page → map.
      - Browser controls: back/forward through anchor changes, reload on
        an anchor, share/copy URL (useShareBooth), opening a link in a new
        tab.
- [ ] **For each entry, write the state it produces** (the §10 matrix
      fields: `sidebarTab × sidebarMode × booth × area × track × day ×
      query × tray`) and where the UI lands visually — e.g. an anchor to a
      booth must scroll/point the sidebar at that booth's row **and** open
      its detail **and** select the right track/area — the "anchor of the
      title" behavior: clicking venue/company/event links routes to the
      title anchor of that content, never a bare empty state.
- [ ] **Hunt invalid cross-state combos** every entry can create:
      - Anchor to a booth whose area ≠ selected track (does the URL win
        and switch the track, or does the UI go disjointed?).
      - Anchor + persisted bookmarks/theme restored simultaneously.
      - Two anchors in conflict (booth of venue A while track of venue B).
      - Invalid/removed booth id, wrong casing, missing venue — must fall
        back to a defined home state, not a half-applied one.
      - Back/forward: does `popstate`/hashchange replay through the same
        guards as a click, or bypass them?
- [ ] **Rules to enforce (same as §10):** every link-arrival state has ≥1
      visible exit; URL is a pure function of a reachable UI state (no
      states only reachable by URL); a click on venue/company/event always
      produces the anchor AND its supporting context (track, area, day)
      atomically.
- [ ] Record the final map as a table in this file (or
      `src/test/url-states.md`) and add traversal cases to `src/test` so
      every anchor is covered by a regression check.

---

## 14 — Motion system (Emil Kowalski × Fluid Functionalism)

Expands §7's motion rule into the full system for this app. Order of
authority: FF spring tokens for values, Emil's decision framework for
whether/why/how, custom-motion.md for recipes. Two ideas agree on the core:
**springs/tokens, not hand-written durations; transform + opacity only.**



### Values (FF tokens replace every hand-written duration)

- [ ] All durations/curves come from `@/lib/springs`: `spring.fast`
      (0.08s — press feedback, tooltips, small pops), `spring.moderate`
      (0.16s — dropdowns, chips, highlight travel), `spring.slow`
      (0.24s — sheet snap, detail panels). Never hand-write a `duration`.
- [ ] Dismissals use the paired `.exit` tween — exits are FASTER than
      enters (Emil's asymmetric timing): sheet close ≈ 60–70% of open;
      dropdown exit < entry.
- [ ] Emil's duration ceilings as sanity caps: buttons 100–160ms,
      tooltips 125–200ms, dropdowns 150–250ms, sheet/drawer ≤ 500ms.
      If a spring overshoots the ceiling for its element class, pick the
      next faster token.
- [ ] Easing never `ease-in` for UI; enter = ease-out family (FF's
      springs already encode this). Constant motion (progress bar,
      live-session blink) = linear/steps as now.



### Reduced motion & performance

- [ ] `MotionConfig reducedMotion="user"` wraps everything (§0); Emil's
      rule for reduced motion: **fewer and gentler, not zero** — keep
      opacity/color fades that aid comprehension, drop transforms and
      position motion. The global 0.01ms kill-switch is too blunt —
      replace with per-property handling (keep fades, drop movement).
- [ ] Only `transform`/`opacity` animate anywhere; no width/height/top/
      left animations (sheet height is the sanctioned exception during
      drag; snap release moves to transform-based or spring-driven).
- [ ] Verify in slow motion (DevTools 2–5×): tooltip/dropdown colors and
      transforms in sync; origins correct; no two objects visible during
      crossfades. Review the next day with fresh eyes.

---

## 15 — Declarative screen-per-state model

Follow-on from §10/§13: once the state space is mapped, make the UI
**declarative** — every state *defines* what the screen shall be, instead of
components imperatively reacting to whichever store field changed last.
Today the screen is the accumulation of side effects (`sidebarMode` flips in
SearchBar, tab switches snap the tray, detail toggles camera moves) — which
is exactly how the §10 no-escape/disjointed states happen.

- [ ] **Define one derived view state.** A pure function
      `resolveViewState(store, url)` collapses the matrix into a single
      discriminated union, e.g. `tray-peek | tray-open | sidebar-list |
      sidebar-search | booth-detail | saved | insights | info` (+ the
      map's camera intent: `overview | hall | booth`). Invalid
      combinations become **unrepresentable** — the resolver decides, not
      the components.
- [ ] **Write the screen table.** For each view state, declare what every
      region renders — the "what the screen shall be" spec:
      | Region | Declared per state |
      | --- | --- |
      | Rail / tab highlight | which item is lit |
      | Sidebar / sheet content | which view + which anchor of the title |
      | Search bar | visible / focused / hint, per state |
      | Live card | shown, full-width home only |
      | Map camera | overview / hall fit / booth fly + offset |
      | Map chrome | which cards, controls, tooltip may show |
      | URL | the exact anchor each state serializes to (§13) |
- [ ] **Render from the declaration.** Components become exhaustive
      switches over the view state (one source of truth per region);
      effects like camera moves live in ONE place keyed on the view
      state — killing the double-camera-move race from §12 and the
      transition guards §10 asks for, by construction.
- [ ] **Transitions become data too.** A small transition table
      (state × event → next state) with the §10 sanitizers baked in
      (area switch clears foreign booth, day switch sanitizes, invalid
      URL → home); outside-click-to-home (§10), Esc, and back/forward all
      become plain events in that table instead of ad-hoc listeners.
- [ ] **Type-enforce it:** the union + transition table get exhaustive
      TypeScript checks (`never` on unhandled states); a state not in the
      table fails the build, not the user.
- [ ] Land the table in `src/test` alongside §10's checklist and §13's
      URL map — one artifact: state → screen → URL, per row.

---

## 16 — Architecture: island decoupling, copy slop, loading UX, prefetch

### A. Organize islands + decouple configurable event properties

The map page is one surface of many designed in the same Figma file — the
event data (zones, booths, companies, sponsors, copy) must be consumable by
future pages without importing map islands.

- [ ] Extract a clean data layer under `src/lib/data.ts` + typed hooks:
      `useEventConfig`, `useVenue/Track/Day`, `useCompanies`, `useBooths`,
      `useSessions` — islands consume hooks, never raw JSON imports.
- [ ] Sponsor/asset entrypoints become **declared interfaces**, not map
      internals: an `EventAssets` contract (e.g. sponsor logos, map SVGs,
      dither/imagery sources) where each asset is a named entrypoint
      (`id → src`) resolved from `src/data/ugm-icd-2026/` — new pages
      (gallery, landing) reuse the same contract instead of re-parsing.
- [ ] Copy stays in `ui.json` (existing rule) but gains a namespace per
      surface (`ui.map.*`, `ui.landing.*`, `ui.gallery.*`) so other pages
      don't inherit map copy.
- [x] Reorganize the map page's boundaries (user direction, Nov 23):
      `src/islands/map/` (all map islands), `src/hooks/map/` (URL booth,
      keyboard shortcut, share, KPI data — vendor FF hooks stay at the
      root, `README.md` records why), `src/lib/map/` (floorplan,
      happening-carousel, share, homography), and
      `src/components/map/kpi/`. Shared UI/data stay in `components/` and
      `lib/`. No logic changed.


### C. Loading UX: skeleton vs View Transition (esp. the WebGL map) — decide, then build

Before polishing further, the map needs a designed arrival: WebGL map init
is slow (tile fetch + shader warmup), and today the user stares at a black
`#09090b` stage.

- [ ] **Evaluate the three options on UX merit, then pick:**
      1. **Skeleton + FF `reveal-swap`** (install `@fluid/reveal`): layout
         true to final state (shadcn Skeleton in `bg-hover`), crossfades
         into the real map block — best for first paint honesty; works
         everywhere, no API dependency.
      2. **Astro `<ViewTransitions />`** for MPA navigations
         (landing/gallery ↔ map): smooth cross-document transition,
         shared-element support (e.g. the event lockup persists between
         pages) — great between pages, does NOT help in-page WebGL init.
      3. **Map-specific boot state**: keep the floor plan visible while
         basemap tiles load (overlay first, basemap fades in) — likely
         the best *map* UX since the floor plan is the hero.
      Recommendation to test: 1+3 combined for the map page (skeleton for
      chrome, floor-plan-first boot for the map), 2 between pages. Decide
      with it on screen; record as a DECISION.
- [ ] Whatever wins: loading state covers every region of §15's screen
      table (chrome skeleton, map boot, sheet content) — no half-loaded
      mash.
- [ ] Respect reduced motion (fades stay, movement drops) and keep LCP
      honest — skeleton must not regress it vs the current black stage.

### D. Prefetch utility for the future landing/gallery page

- [ ] Build a small utility (`src/lib/prefetch.ts` or an Astro
      `data-astro-prefetch` convention) wrapping Astro's built-in
      `prefetch()` so the future landing/gallery page pre-fetches the map
      route on hover/viewport of its links.
- [ ] Prefer `viewport` strategy for gallery grids, `hover` for nav links;
      respect `prefers-reduced-data`/Save-Data.
- [ ] Works from the map side too: back-links to the landing page prefetch
      so gallery navigation feels instant.
- [ ] Keep it declarative (one prop/component) so §16-A's feature
      boundaries hold — pages opt in via config, not per-link plumbing.

### E. Per-area floor-plan ("denah") contract

The current floor plan is GIK Hall C1 mapped from GeoJSON coordinates
(`MapLibreMap` booth lnglats + homography onto `gik-hall-c1.svg`). Per the
Figma source, other tracks — e.g. **Career Counseling** — will get their
own authored SVG plans. Prepare the interface now so real SVGs slot in
without rework:

- [ ] Define a `FloorPlanSource` contract (fits §16-A's `EventAssets`):
      `{ areaId, svgSrc, frame: { width, height }, geoBounds, alignment:
      anchor points or corner geoms for the homography, labelOverrides }`
      authored per area in `src/data/ugm-icd-2026/` (JSON, per the
      JSON-driven rule).
- [ ] Generalize `FloorPlanOverlay` + `MapLibreMap` booth geometry to a
      registry keyed by `areaId`: booths, glow, hit-testing, and the
      homography read from the registry instead of the hardcoded C1
      composite. Career Counseling (and any future area) becomes a data
      entry, not a code branch.
- [ ] Until real SVGs arrive: areas without a `FloorPlanSource` fall back
      to the GeoJSON-derived mapping (current behavior) — declared in the
      contract as `source: 'authored-svg' | 'geojson'`.
- [ ] Booth centers per area come from the registry entry too (the
      approximate `BOOTH_LNGLATS` note in DESIGN.md assumption 4 resolves
      per-area when each SVG locks).

## 17 — Mini-interaction pass (un-stiffen)

§14 sets the motion *system*; this pass adds the small deliberate
interactions that make it feel alive — Emil's "delight allowed" tier
(rare/occasional surfaces only; never on high-frequency actions):

- [ ] Quick-find chips: press crumb (scale 0.97 exists) + a tiny hover
      lift/ring via the fluid-hover glide (§0) — currently flat.
- [ ] Day-picker squares: selected fill pops in at spring.fast (fill
      scale 0.9→1 + opacity), press feedback per box; never animate the
      switch itself (keyboard/high-frequency rule).
- [ ] Bookmark toggle: fill + a small scale pop on add (0.9→1 spring), a
      plain crossfade on remove (asymmetric enter/exit, §14).
- [ ] Drag handle: grows on grab (`w-10 → w-14` at spring.fast) while
      dragging, relaxes on release — makes the tray feel held.
- [ ] Live-session dot: keep the steps blink (Persona-5 signature) but
      sync the "Next" tag swap with a 100ms crossfade so it doesn't pop.
- [ ] Track pills: fluid-hover glide (§0) already un-stiffs them; add the
      300ms "acknowledge the pick" fill pulse on selection (FF select
      behavior) if it doesn't fight the inset bar (§8).
- [ ] Map booth selection: the glow pulse (`.booth-pulse`) stays
      functional; add a 1-frame settle (scale 1.02→1 on the tooltip) so
      selection feels received.
- [ ] Empty states (§16/§2): one small motion each (e.g. the empty box's
      border draws in, or a dither-free pixel sprite idle) — a dead
      empty state is the stiffest thing on the page.
- [ ] Cap it: every mini-interaction ≤ 250ms, transform/opacity only,
      reduced-motion drops movement (fades stay). If a surface reads
      stiffer after adding — remove, don't tune.

## Verify (before calling it done)

- [ ] Screenshots at 375 / 640 / 768 / 1024 / 1440 — desktop chrome only
      ≥768px; sheet below.
- [ ] Walk the path: search → booth detail → bookmark → share → day switch,
      with mouse, keyboard (focus ring visible, tab order sane), and touch
      (sheet drags, no hover latching).
- [ ] Reduced motion: tooltips/dropdowns still communicate (opacity/color),
      sheet snaps without easing.
- [ ] Console clean; no layout shift from the FF hover highlight
      re-measures.
- [ ] Agreement with `DESIGN.md` + the DECISIONS recorded in §0; update
      `DESIGN.md` where polish changed the record.
