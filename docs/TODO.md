# ICD 2026 Map Implementation TODO

## Phase 0 — Foundation & Data
- [x] Read project structure and Figma design via MCP
- [x] Add `maplibre-gl` and `lucide-react` to `package.json` so `npm ci` installs them
- [ ] Run `npm ci` to install dependencies
- [x] Create modular data layer under `src/data/ugm-icd-2026/`
  - `event.json`, `venues.json`, `zones.json`, `booths.json`, `companies.json`, `sessions.json`, `quickfind.json`
  - `maps/gik-hall-c1.svg` (SVG composited from Figma updated layout node `1655:23485`)
- [x] Add `Priego` font-face (source files in `docs/assets/fonts/`, served from `public/fonts/`) and wire minimal font CSS
- [x] Decouple non-functional copy into `src/data/ugm-icd-2026/ui.json`
- [x] Enrich company `openings` and `sessions.json` schedules from Figma screenshots
- [ ] Create formal design tokens (granite black, accent colors, Swiss spacing, minimal radius)

## Phase 1 — Map Tile & SVG Overlay
- [x] Build reusable `MapLibreMap` React island (`src/islands/MapLibreMap.tsx`)
  - Use OpenFreeMap tiles (`https://tiles.openfreemap.org/styles/dark`)
  - Limit viewport to GeoJSON bounds (provided LineString coordinates)
- [x] Render SVG floor-plan overlay on top of the map
  - Use GeoJSON LineString to anchor SVG corners via homography transform
  - SVG source swappable per-area via data config
- [x] Add map controls: custom zoom in/out + compass + fullscreen buttons (dark, consistent style)
- [x] Add compass + floating "Hall C1 / Career Expo" indicator on map
- [x] Replace default MapLibre navigation/fullscreen controls with custom-styled dark buttons
- [x] Tooltip + colored glow when clicking/hovering SVG booth
- [x] Move map navigation controls to top-right to match Figma (`+`, `-`, fullscreen)
- [x] Tune selection glow to match Figma (zone color with stronger drop-shadow)
- [x] Add click/hover sync between SVG booths and sidebar detail view
- [x] Fly map to selected booth when chosen from sidebar

## Phase 2 — Page Layout & Sidebar UI
- [x] Create `/map` Astro page using `BaseLayout`
- [x] Implement desktop split layout: fixed left sidebar (≈380px) + map filling remainder
- [x] Build sidebar shell:
  - Header: title, date switcher (28 / 29 / Today), search bar
  - Quick Find chips (Toilet, Mushola, Pusat Bantuan)
  - "Happening Now" card
  - Track/venue dropdowns (GIK → Career Expo / Walk-in Interview / Career Counseling)
  - Venue list grouped by zone with color accents
- [x] Improve icons (Lucide) and spacing for a clean Vercel-like sidebar
- [x] Swiss design: minimal rounded corners, tight typography, strong hierarchy
- [x] Functional left icon rail: Home, Search, Saved, Stats, Info/Help tabs wired to Zustand
- [x] Create `Insights` component for Stats tab (2×2 stat cards from `ui.json`)
- [x] Create `BookmarkList` component for Saved tab (bookmarked booths + session badges)
- [x] Create `EventInfo` component for Info/Help tab (venue, hours, what-to-bring, help)
- [x] Fix duplicate Help/Info button in `MapSidebar` rail (single Help/Question icon at bottom)
- [x] Strictly match Figma rail: labels `Home`, `saved`, `Stats`, `Info`, `Help`
- [x] Update `TrackSwitcher` styling to match Figma tabs (dark pills, active pink dot, venue pill first)
- [x] Add dropdown items for Walk-in Interview and Career Counseling showing area + company

## Phase 3 — Mobile Layout
- [x] Collapse sidebar into a draggable bottom sheet (Google Maps style)
- [x] Keep quick-destination chips and track switcher on top
- [x] Search bar lives on the draggable tray
- [x] Map tab switcher anchored top-center
- [x] Add mobile rail/tab switcher inside bottom sheet for Saved/Stats/Info views
- [x] Make track switcher horizontally scrollable on small screens
- [x] Add safe-area and viewport-fit handling for notched devices
- [ ] Ensure map remains interactive under the sheet (needs testing)
- [ ] Map visual pass: floorplan should appear straight and centered like Figma, currently rotated and cropped
- [ ] Map base layer: swap to a provider that shows streets/subtle context (OpenFreeMap dark is too bare)
- [ ] Sidebar visual pass: match Figma spacing, typography, rail layout, and font exactly
- [ ] Track switcher: convert to Figma-style dropdowns, not horizontal pills
- [ ] Font: load and apply the correct typeface from Figma (not system fallback)
- [ ] Overflow/scrolling: replace stiff sidebar scroll with smoother, Persona 5-style motion
- [ ] Booth interactivity on exported SVG: re-wire click/hover targets after replacing floorplan asset

## Phase 4 — State Management & Interactivity
- [x] Define central map state store (Zustand) with:
  - `selectedVenueId`, `selectedAreaId`, `selectedTrackId`, `selectedDayId`
  - `hoveredBoothId`, `searchQuery`, `bookmarkedIds`
  - `mapViewState` (center, zoom, bearing)
- [x] Add `sidebarTab` state and `setSidebarTab` action
- [x] Sync sidebar selection to map:
  - Click venue in sidebar → open detail panel + highlight on map
  - Click area on map SVG → update sidebar to show that area/venue detail
- [x] Default state loads Career Expo Hall C1 venue list
- [x] Build booth/venue detail panel (company, tags, booth code, session time, opportunities, external links)
- [x] Implement bookmark toggle state (persisted to localStorage)
- [x] Wire Search rail tab to focus search input and show search results
- [x] Clear search with X button in search bar
- [x] Analytics interface: async event tracking for bookmarks, booth selects, search, tab/area/day switches, share, facility/CTA clicks with UUIDv7 userId + userAgent
- [x] Non-blocking transport (`sendBeacon` → `fetch keepalive`) with localStorage retry queue and robust exception handling
- [x] Add reusable `KpiTile` component with animated value, delta badge, and interactive sparkline
- [x] Add `useKpiData` hook + provider interface for future analytics-backed KPI data
- [x] Wire `Insights` tab to show job-market KPI tiles with empty-state sparklines
- [ ] Clear/focus behavior audit when switching sidebar tabs

## Phase 5 — Fluid Functionalism Integration
- [ ] Install Fluid Functionalism components via shadcn CLI into the Astro project
  - Command: `npx shadcn@latest add https://www.fluidfunctionalism.com/r/setup/sharp-tabler.json --overwrite`
  - Requires `components.json` and resolving Astro + React compatibility
- [ ] Replace generic inline-styled elements with Fluid components where reusable
  - Button, Input, Badge, Card, Switch, Tooltip
  - Keep custom sidebar styling strictly per Figma
- [ ] Load Inter with `opsz` axis if switching to Fluid typography
- [ ] Wrap app in `<FluidRoot>` inside theme provider

## Phase 6 — Polish, QA & Refactoring
- [ ] Apply modern-web-guidance takeaways (native popover for tooltip, dialog/scroll-snap for mobile sheet, anchor positioning for dropdowns where supported)
- [ ] Replace custom homography solver in `MapLibreMap.tsx` with a matrix math library (e.g. `ml-matrix`) when installing dependencies
- [ ] Apply Vercel React best-practice optimizations (memoize derived lists, stable callbacks, etc.)
- [ ] Audit clear/focus behavior when switching sidebar tabs (auto-focus search on Search tab)
- [x] Add subtle press/hover states following Emil Kowalski principles
- [x] Apply custom easing curves and transform-origin-aware tooltip/dropdown animations
- [x] Verify reduced-motion preferences (global media query + per-component overrides)
- [ ] Type-check and lint
- [ ] Run dev server and visually verify map bounds, sidebar sync, mobile sheet
- [ ] Final visual pass against Figma node `1630:29309`
