# Polish — ICD 2026 Map Page

Execution order is top-down. Sources: impeccable polish audit (breakpoints /
padding / type / color) and the Fluid Functionalism stack read.

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
- [ ] One-time stack repair (blocks future FF installs/updates):
      - `npx shadcn@latest init` (no `components.json` yet) — configure for
        Tailwind v4 + `@/` alias, base flavor.
      - Map the granite/pink palette onto shadcn theme tokens in
        `src/styles/base/global.css` (`--background #09090b`,
        `--foreground #fafafa`, `--primary #ff2d6f`, `--border #27272a`,
        `--muted-foreground #8f8f8f`, plus `--hover` / `--active` grays).
        This merges with the color-token task in §2 — do them together.
      - Verify `MotionConfig reducedMotion="user"` in
        `src/lib/fluid-provider.tsx` wraps the **whole app root**, not just
        FF blocks (mount it in `BaseLayout.astro`'s React root).
- [ ] Wire `useFluidHover` + `FluidHoverHighlight` (one gliding highlight per
      list, replacing per-row hover classes):
      - `VenueList` booth rows — `useFluidHover(container, { axis: "y" })`;
        the pink `inset 3px 0` selection bar stays a static selected style;
        the hover highlight glides. Keyboard focus calls `setActiveIndex`.
      - `MapSidebar` icon rail (5 buttons) — `axis: "y"`. While there, fix
        the near-invisible active state (`#3b3b3b` on `#262626`): white icon
        + 2px pink left rule.
      - `MobileBottomSheet` tab rail — `axis: "x"`.
      - `TrackSwitcher` pills — `axis: "x"`.
      - `QuickFind` — `axis: "x"`.
- [ ] Replace `overflow-y-auto` in the sidebar scroll region with
      `<ScrollArea viewportClassName="scroll-fade">`; replace
      `overflow-x-auto` in `TrackSwitcher` with
      `<ScrollArea orientation="horizontal" viewportClassName="scroll-fade-x">`.
- [ ] Size ladder: `SizeProvider size="compact"` around sidebar/sheet content
      so FF components (badge, button, KpiTile) inherit the 28px step.
- [ ] Motion tokens: import `spring` from `@/lib/springs` for tooltip /
      dropdown / press motion in the islands; remove hand-written
      `150ms`/`200ms`/`350ms` durations where a spring token fits.
- [ ] Shortcut caps: replace hand-built `<kbd>` in `SearchBar` / `QuickFind`
      with `KeyCaps` from `@/lib/key-cap` (`tone="inverted"` on dark).
- [ ] Record DECISIONS (where the project keeps intent):
      1. FF type rules (no uppercase / no letter-spacing / no raw px) do NOT
         apply to the map islands — the Figma Persona-5 type world stays
         local. FF motion/hover/scroll/size systems apply fully.
      2. Accent pink = `#ff2d6f` (`global.css` wins over `DESIGN.md`'s
         `#f63d6e` and the overlay fallback `#ff316b`).

## 1 — P0: Responsive spine

- [ ] Move the desktop/mobile switch from `sm:` (640px) to `md:` (768px)
      everywhere in the app surfaces: `map.astro` sidebar/quick-find/sheet,
      `MapSidebar` rail, `MapLibreMap` control rails, `TrackSwitcher` pill
      padding/size, `SearchBar` Ctrl+K hint, `Insights` grid trigger.
      At 641–767px today, 462px of chrome leaves ~180px of map.
- [ ] Add a compact mobile header to `MobileBottomSheet`: brand lockup +
      the 2×2 day picker + Today/T-X chip. **Day switching is currently
      impossible on mobile.** Show the lockup at half/full snaps.
- [ ] Replace magic-number couplings:
      - `bottom-[178px]` (zoom/compass) → derive from the sheet's actual
        peek height (export `SNAP_PEEK` + tab rail height as shared
        constants, or read the sheet ref).
      - `top-[64px]` (venue card) → measure the track switcher height or
        move the card into the switcher row.
- [ ] Container queries: `Insights` 2×2 grid and `BoothDetail` CTA row
      respond to the sidebar/sheet width (`@container`), not the viewport —
      today the 2×2 grid fires on a 390px desktop sidebar but not a
      full-width mobile sheet (exactly backwards).

## 2 — P0: Color tokens that guide the eye

- [ ] Reconcile pink to one value (`#ff2d6f`) and use `var(--accent-pink)`
      (or the shadcn `--primary` mapping from §0) everywhere; fix
      `DESIGN.md` and the `FloorPlanOverlay` fallback to match.
- [ ] Collapse ~35 hard-coded hexes onto one ladder:
      `bg #09090b → elevated #121215 → surface #1c1c20 → interactive
      #3b3b3b → hover` and 3 text steps (`#fafafa / #a1a1aa / #8f8f8f`).
      `#4a4a4a`/`#575757`/`#414141`/`#444`/`#333` all become surface roles.
- [ ] Accent discipline:
      - Yellow `#f5b400` keeps ONE meaning: time-critical countdown.
      - Rail active state gets the pink treatment (see §0 rail item).
      - Zone-colored booth-code chips per list row (DESIGN.md already
        specifies them; currently only a 3px `borderTop` carries zone
        color) — links list rows to colored map booths.
      - Primary CTA stays white (`bg-white text-black`) = destination;
        pink = state. Reading order: pink tells you where you are, white
        tells you where to go.
- [ ] Contrast fixes: search placeholder `#bbb` on `#444` (≈3.6:1) → lift
      field bg or placeholder; `#71717a` text on `#4a4a4a` chips; booth
      count `#5f5f5f` → `#8f8f8f`.
- [ ] Hover gating: wrap hover styles in `@media (hover: hover) and
      (pointer: fine)` — touch tablets ≥640px currently latch hover states.
      (The fluid-hover system handles this natively once wired in §0.)
- [ ] Focus-visible: pink 2px focus ring globally on interactive elements.
- [ ] Boxiness as part of this pass: audit radii (max 4/6px, sharp allowed
      per the pixel aesthetic), 1px borders, hard offset shadows — remove
      any soft/glassy leftovers (`backdrop-blur` on the sheet may stay
      unless it reads glassy; judge on screen).

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
- [ ] One gutter token per context (sidebar 14px, sheet 16px); stop mixing
      `px-3.5` / `px-4` within the same role.

## 5 — P2: Sweep

- [ ] 10px footnote audit (attribution, kbd hints) — keep or align.
- [ ] Remove dead styles, debug leftovers, and any polish churn at the end
      (source diff pass).
- [ ] Run the mechanical detector once UI is finished:
      `impeccable detect --json --changed` (manual — no hook active).

## 6 — Layout de-clunk (from Nov 21 screenshots)

### Desktop
- [ ] Compress the sidebar header: replace the four floating fragments
      (ribbon / lockup / day-picker / chip) with one header grid on shared
      baselines; reclaim ~40px of dead band above the search bar
- [ ] Slim the search bar: h-[42px] + 3px border → 36–38px, 2px border,
      move the Ctrl K hint out of the truncation path; placeholder must
      not truncate
- [ ] De-densify the live-session card: keep ONE accent (pink hard
      shadow), demote the yellow border to the countdown only, merge the
      two meta rows into one line, footer row into the card's bottom edge
- [ ] Fix map chrome collisions: move zoom/compass rail clear of the E/F
      label band (hug the right edge below the Hall C1 card), lift
      quick-find off the bottom edge (it clips), separate attribution
- [ ] Consider a narrower sidebar step at md (360px) widening to 390px at
      lg, so 768–1024px screens keep more map

### Mobile
- [ ] Reorder sheet content: map + live session first; search lives in the
      Search tab (it already exists) — peek shows tab rail + live card,
      not a search field
- [ ] Snap the peek to a content boundary: peek height = handle + tab rail
      + live-session card header, so the card never beheads
- [ ] Track switcher: full-width ScrollArea with scroll-fade-x so
      "Career Counseli" truncation gets a fade cue, not a hard cut
- [ ] Add the mobile day-picker/brand header (already §1 P0 — the
      screenshots confirm it)

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
      - Sidebar rail + mobile tab rail active state: pink left rule
        (already planned in §0 rail item — same language).
- [ ] **Zone color = chips and fills, never strips.**
      - VenueList zone card: remove the `borderTop` strip; zone identity
        moves to the colored booth-code chips (already planned in §2) and
        the zone header row.
      - MapTooltip: right 3px border → left 3px bar (same orientation as
        every other selection surface); fix the arrow corner so it stops
        inheriting the odd width.
- [ ] **Hard-offset shadow = HappeningNow only.** It's the Persona-5
      signature — keep it there as the ONE sanctioned offset shadow; other
      floating cards use 1px borders + the surface ladder (§2), not soft
      `shadow-lg`/`backdrop-blur` (see §2 boxiness item).
- [ ] **Structural side borders: 2px black/40 → 1px `var(--border)`.**
      Two heavy black side borders (rail, sidebar) add visual weight the
      palette ladder should carry instead.
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
- [ ] The search bar demotes from loudest to quiet-first-class: 36–38px
      height, 2px border, secondary surface (already in §6) — search is a
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
- [ ] Reorganize `src/islands/*` → feature folders (`features/map/…`)
      with the `features/_template` scaffold that already exists; shared
      UI stays in `components/`. No logic moves — just boundaries.

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

---

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
