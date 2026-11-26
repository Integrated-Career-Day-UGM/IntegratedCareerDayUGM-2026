# UGM Integrated Career Days 2026 — Map Page Design Record

This document captures design decisions, assumptions, and conventions used while implementing the interactive map page for UGM ICD 2026. It is updated continuously during the build.

## Source of Truth

- Figma file: `https://www.figma.com/design/Bol9R2faeoBcCLXRAEc0Xd/ICD-NOV-2026`
- Primary map-page node: `1630:29309` (section containing 4 desktop states)
- Updated floor-plan vector node: `1655:23485` (Group 143727349)
- Desktop MCP used for design context; screenshots from Figma are the visual reference.

## Design Principles

1. **Dark granite foundation** — background is `#09090b` (granite). Map tiles are OpenFreeMap dark. The UI floats on this dark surface.
2. **Swiss / Vercel-like UI** — minimal rounded corners (`radius-sm: 4px`, `radius-md: 6px`), tight tracking, high contrast, clear hierarchy, restrained color.
3. **Pink accent** - `#ff2d6f` is the primary action/accent color (badges, active states,selection glow, CTAs).
4. **Data-driven colors** — zone colors come from `zones.json`; venue/area changes drive map overlay colors.
5. **No mascot artwork** — per user instruction, mascot illustration in Figma is ignored.
6. **Responsive** — desktop uses a fixed left sidebar with icon rail; mobile uses a draggable bottom sheet.
7. **Configurable copy** — all non-functional copywriting lives in `src/data/ugm-icd-2026/ui.json` so it can change without touching components.

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [rail] │  Sidebar (380px)            │  Map area           │
│  Home  │  ─────────────────────────  │  ┌───────────────┐  │
│  Saved │  Badge / Title / Date tabs  │  │ Track switcher│  │
│  Stats │  Search bar                 │  ├───────────────┤  │
│  Info  │  Quick Find  | Happening Now│  │               │  │
│  Help  │  Venue list / Detail / etc. │  │   MapLibre    │  │
│        │                             │  │   + SVG       │  │
│        │                             │  │   overlay     │  │
│        │                             │  │               │  │
│        │                             │  │  Hall C1 card │  │
└─────────────────────────────────────────────────────────────┘
```

- Desktop sidebar: `w-[380px]`, border-r `zinc-800`, inner content `bg-[#0c0c0f]`.
- Left icon rail: `w-[58px]`, `bg-[#09090b]`, icons with labels, active item `bg-zinc-800 text-white`.
- Mobile: bottom sheet with drag handle, three snap points (peek/half/full).

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--granite` | `#09090b` | Page/map background |
| `--granite-elevated` | `#121215` | Elevated surfaces (floating cards) |
| `--surface` | `#1c1c20` | Controls, tooltips, dropdowns |
| `--border` | `#27272a` | Borders, dividers |
| `--text-primary` | `#fafafa` | Headings, primary text |
| `--text-secondary` | `#a1a1aa` | Secondary text |
| `--text-muted` | `#71717a` | Muted labels |
| `--accent-pink` | `#ff2d6f` | Primary accent, badges, selection glow, CTAs |
| `--accent-cyan` | `#45d7c9` | Zone C / center booths |
| `--accent-purple` | `#6949ff` | Zone E / east booths |
| `--accent-magenta` | `#fd19e5` | Zone D |
| `--accent-navy` | `#1c2e4a` | Zone A/B main booths |

## Typography

- Primary font: `Priego` (loaded from `public/fonts/`), fallback to system UI.
- Weights: 400/500/600/700/900.
- Sizes follow Tailwind scale; labels are often `text-[10px]` uppercase with `tracking-wide`.

## Animation & Micro-interactions

Following Emil Kowalski principles:

- **Custom easing tokens**: `--ease-out`, `--ease-in-out`, `--ease-drawer` in global CSS.
- **Buttons**: global `:active` scale to `0.97` for press feedback; explicit `active:scale-*` utilities can override.
- **Tooltips**: scale from `0.95` + fade, 150ms `--ease-out`, `transform-origin: center bottom`.
- **Dropdowns**: scale from `0.95` + fade, 150ms `--ease-out`, `transform-origin: top left`.
- **Bottom sheet**: height animation 350ms `--ease-drawer`.
- **No animation from `scale(0)`**: all entrances start from `scale(0.95)` with opacity.
- **`prefers-reduced-motion`**: global media query disables transitions; per-element overrides for tooltip/dropdown.

## Components

### Track Switcher (top of map)

- Horizontal row of rounded-sm pills on a dark translucent backdrop.
- First pill is the venue name (`GIK`).
- Subsequent pills are track/area tabs: `Career Expo`, `Walk-in Interview`, `Career Counseling`.
- Active tab: light surface + pink underline/accent.
- Switching tabs updates `selectedAreaId` and clears selected booth.

### Sidebar Rail

Five tabs:

1. **Home** — main list/search/detail flow.
2. **Search** — focuses search input; shows search results when query exists.
3. **Saved** — bookmarked booths/sessions.
4. **Stats** — event insights cards.
5. **Info** — event info / help.

Clicking a tab sets `sidebarTab` in the store. Search input is always visible; the Search tab is a shortcut to focus it.

### Search Bar

- Placeholder: `"Search company, role, booth..."` (from `ui.json`).
- Left `Search` icon.
- Right `Ctrl + K` shortcut hint (hidden on mobile).
- Typing toggles `sidebarMode` to `'search'`; clearing returns to `'list'` or `'detail'`.

### Quick Find

- Section title `"Quick Find"`.
- Three visible buttons from `quickfind.json`: Toilet, Mushola, Help Desk.
- Buttons have icon + label, dark surface, hover lift.

### Happening Now

- Card with pink left border and `"Now"` badge.
- Shows current track session for the selected day.
- Clicking navigates to that area.

### Venue List

- Grouped by zone.
- Each zone has a colored top separator bar (`h-1 w-full rounded-full`).
- Each row: colored booth-code square + company name.
- Search results additionally show tags and a bookmark toggle icon.

### Booth Detail

- Header label `"Selected company / event / venue"`.
- Company name + booth code badge + zone color.
- Bookmark toggle + close button.
- Tags.
- CTA row: Company Website / Program URL.
- `"Available Opportunity"` list (data from company `openings`).

### Insights

- Four stat cards in a 2×2 grid.
- Values are configurable in `ui.json`.
- Bookmarks card reflects live bookmark count.
- New "Job Market Pulse" section below the stat cards uses reusable `KpiTile` components.
- `KpiTile` shows an animated value, delta badge, and interactive sparkline.
- `useKpiData` hook + `KpiDataProvider` interface allow swapping in a future analytics endpoint.
- Default provider returns empty data, so tiles render an empty-state sparkline with "No data yet" copy.

### Map Tooltip

- Fixed-position tooltip above the hovered/selected booth.
- Company name + booth code.
- Right border colored by zone.

### Map Controls

- Custom dark buttons styled consistently with the rest of the UI.
- Zoom in/out buttons + compass stacked bottom-left.
- Fullscreen button top-right.
- Default MapLibre NavigationControl/FullscreenControl removed in favor of these custom controls.
- Floating Hall C1 card bottom-right.

## Mobile Layout

- Breakpoint: `<sm` (640px) switches from desktop sidebar to mobile bottom sheet.
- Bottom sheet has three snap points: peek (~110px), half (~320px), full (~82% viewport).
- Drag handle uses `touch-action: none` so dragging the sheet does not pan the map.
- Internal icon rail inside the sheet exposes Home, Search, Saved, Stats, and Info views.
- Track switcher is horizontally scrollable on mobile and wraps on desktop.
- `viewport-fit=cover` and `env(safe-area-inset-bottom)` handle notched devices.

## State Management

Zustand store (`mapStore.ts`) with persist middleware:

- `selectedVenueId`, `selectedAreaId`, `selectedTrackId`, `selectedDayId`
- `selectedBoothId`, `hoveredBoothId`
- `sidebarMode`: `'list' | 'detail' | 'search'`
- `sidebarTab`: `'home' | 'saved' | 'stats' | 'info' | 'help'`
- `searchQuery`
- `mapView`
- `bookmarkedIds` (persisted)

## Analytics

- `src/lib/analytics.ts` defines a pluggable `AnalyticsProvider` interface.
- Transport is non-blocking: `navigator.sendBeacon` first, then `fetch(..., { keepalive: true })`.
- Designed for HTTP-to-Kafka proxies (Confluent REST Proxy, Kafka Connect HTTP Source).
- Events include UUIDv7 `eventId`, stable anonymous UUIDv7 `userId`, `userAgent`, ISO timestamp, event type, and payload.
- Tracked events: `bookmark.add` / `remove`, `booth.select`, `item.click`, `search.query`, `sidebar.tab.switch`, `area.switch`, `day.switch`, `share.send`, `facility.click`, `cta.click`, `page.view`.
- Robust error handling: failures are caught and queued in localStorage for retry via `flushAnalyticsQueue()`.
- Swap `defaultProvider` with `createHttpProvider(endpoint)` when the gateway is live.

## Data Model

Files under `src/data/ugm-icd-2026/`:

- `event.json` — event metadata, days, tracks, default venue, locale.
- `venues.json` — venues and their areas.
- `zones.json` — zones with colors and booth IDs per area.
- `booths.json` — booth code, label, zone, company.
- `companies.json` — company metadata + `openings`.
- `sessions.json` — timed sessions per area/company/day.
- `quickfind.json` — quick-find facilities/waypoints.
- `ui.json` — all non-functional copywriting.

## Assumptions

1. Event days are **28–29 November 2026** (kept as user-specified; Figma placeholder 25–27 ignored).
2. Zone colors are authored in `zones.json` and are venue/area-specific.
3. The floor-plan SVG (`public/maps/gik-hall-c1.svg`) is a placeholder composite aligned to GeoJSON bounds via homography.
4. Booth center coordinates in `MapLibreMap.tsx` are approximate and will be refined when the final SVG geometry is locked.
5. Selection glow uses the booth’s zone color as required; hover uses the same zone color at lower intensity.
6. Map tiles are OpenFreeMap dark (`https://tiles.openfreemap.org/styles/dark`) until the user supplies another provider.
7. Mascot artwork is excluded from implementation.
8. Quick Find is limited to the first three facility items for the sidebar preview; all items remain available in data.
9. Insights numbers are configurable copy, not live analytics, except bookmarks count.
10. Job openings are functional data stored per company in `companies.json`.

## Open Questions / TODO

- Replace custom homography solver with a matrix library when dependencies are installed.
- Add reduced-motion handling audit.
- Apply Vercel React best-practice memoization pass after UI is stable.
- Integrate Fluid Functionalism components for generic reusable pieces (Button, Input, Badge, Card, Switch, Tooltip) while keeping the custom sidebar strictly per Figma.
- Create missing sidebar views: `Insights`, `BookmarkList`, `EventInfo`.
- Final visual verification against Figma after dependencies install.
