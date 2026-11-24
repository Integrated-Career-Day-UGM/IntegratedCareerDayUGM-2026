# Product Requirements Document — UGM ICD 2026 Interactive Map

## 1. Overview

An interactive, Google-Maps-style floor-plan map for UGM Integrated Career Days 2026. It helps job seekers find venues/booths, explore companies, save opportunities, and navigate the event.

## 2. Target Users

- **Primary**: Job seekers / students looking for companies and opportunities.
- **Secondary**: Event attendees trying to find facilities (toilet, mushola, help desk) and sessions.

## 3. Core Jobs-to-be-Done

1. Quickly locate a company booth on the map.
2. See what a company offers (tags, jobs, session times).
3. Save interesting booths/opportunities for later.
4. Share an opportunity with a friend.
5. Find facilities and event info without getting lost.

## 4. Key Features

### 4.1 Interactive Map
- Dark granite base map (OpenFreeMap dark tiles).
- SVG floor-plan overlay pinned to GeoJSON bounds.
- Click any booth to see company name + booth code tooltip.
- Selected/hovered booth glows with its zone color.
- Map flies to the selected booth.
- Top-right zoom/fullscreen controls; bottom-left compass; bottom-right Hall C1 card.

### 4.2 Sidebar Navigation
- Left icon rail: Home, Search, Saved, Stats, Info, Help.
- Header: event title, date switcher (28/29), "Today" badge.
- Search bar with `Ctrl+K` shortcut and clear button.
- Quick Find chips: Toilet, Mushola, Pusat Bantuan.
- Happening Now card showing current session.
- Venue List grouped by zone with color-coded separators.

### 4.3 Company / Booth Detail
- Company name, booth code badge, session time badge.
- Tags (e.g., Tech, Banking, BUMN).
- CTAs: Company Website, Program URL.
- Share button to copy/share opportunity link.
- Bookmark toggle.
- Available opportunities list (job title + type).

### 4.4 Bookmarks
- Saved tab lists all bookmarked booths.
- Each item shows company name, booth code, session time, track label.
- Bookmark toggle removes/adds items.
- Persisted to localStorage.

### 4.5 Insights
- Stats tab shows event overview cards: attendance, company count, sessions today, your bookmarks.

### 4.6 Info / Help
- Venue, event hours, what to bring, and help-desk information.

## 5. Data Architecture

All content is decoupled from components:

- `src/data/ugm-icd-2026/event.json` — event metadata, days, tracks, default venue.
- `src/data/ugm-icd-2026/venues.json` — venues and areas.
- `src/data/ugm-icd-2026/zones.json` — zone colors and booth IDs.
- `src/data/ugm-icd-2026/booths.json` — booth codes, zones, company IDs.
- `src/data/ugm-icd-2026/companies.json` — company info, tags, URLs, job openings.
- `src/data/ugm-icd-2026/sessions.json` — timed sessions per area/company/day.
- `src/data/ugm-icd-2026/quickfind.json` — facilities/waypoints.
- `src/data/ugm-icd-2026/ui.json` — all copywriting, labels, and static text.

## 6. State Management

Zustand store with persist middleware for bookmarks:

- `selectedVenueId`, `selectedAreaId`, `selectedTrackId`, `selectedDayId`
- `selectedBoothId`, `hoveredBoothId`
- `sidebarMode`, `sidebarTab`
- `searchQuery`
- `bookmarkedIds` (persisted)

## 7. UI/UX Principles

- Dark granite background; Swiss/Vercel-like clean UI.
- Pink accent (`#FF316B`) for CTAs, active states, selection glow.
- Minimal rounded corners; tight typography.
- Mobile: bottom sheet with drag handle and internal tab rail.
- Desktop: fixed 380px sidebar with icon rail.

## 8. Share Functionality

- Share button in booth detail copies a shareable link/text to clipboard.
- Shared content includes company name, booth code, job openings, and a deep link (`?booth=<id>`).
- Fallback: uses Web Share API when available.

## 9. Analytics Interface (Data Lake Ready)

- Events are emitted asynchronously without blocking the main thread.
- Transport prioritizes `navigator.sendBeacon` (non-blocking, survives page unload); falls back to `fetch(..., { keepalive: true })`.
- Built for HTTP-to-Kafka gateways (Confluent REST Proxy, Kafka Connect HTTP Source, etc.): clients send JSON over HTTP and the proxy produces Kafka records.
- Event envelope includes:
  - `eventId`: UUIDv7
  - `userId`: stable anonymous UUIDv7 stored in localStorage
  - `userAgent`: browser user agent (enables surrogate-key analytics)
  - `timestamp`: ISO 8601
  - `eventType` and `payload`
- Tracked events:
  - `bookmark.add` / `bookmark.remove`
  - `booth.select` / `item.click`
  - `search.query`
  - `sidebar.tab.switch` / `area.switch` / `day.switch`
  - `share.send`
  - `facility.click`
  - `cta.click` (Company Website, Program URL)
  - `page.view`
- Robust error handling: every failure is caught and the event remains in a localStorage queue for retry via `flushAnalyticsQueue()`.
- Replaceable `AnalyticsProvider` interface; swap in `createHttpProvider('/api/analytics')` when the gateway is live.
- Use cases: "how many users bookmarked this job opening?", "which companies are most bookmarked?", "which CTAs are clicked?", "visitor flow by user agent".

## 10. Accessibility

- Keyboard navigation for search (`Ctrl+K`).
- ARIA labels on icon buttons.
- Reduced-motion media query respected for CSS transitions.

## 10. Out of Scope

- Fluid Functionalism component integration (deferred until after visual review).
- Live analytics for Insights (values are configurable copy).
- Mascot artwork.

## 11. Pain Points Addressed

- "I can't find the booth" → search + map fly-to + zone grouping.
- "I forgot which companies I liked" → persistent bookmarks.
- "I want to tell my friend about this job" → share button.
- "When is the session?" → Happening Now + session time badges.
- "Where is the toilet/mushola?" → Quick Find chips.
- "What should I bring?" → Info tab.
