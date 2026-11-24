# Map page — state map (code-derived)

Scope: `/map` only. Derived from `src/stores/mapStore.ts`,
`src/islands/MapLibreMap.tsx`, `MapSidebar`, `MobileBottomSheet`,
`TrackSwitcher`, `useBoothFromUrl`. This is the §10/§13 artifact: state →
screen → URL, plus the transitions and invariants the UI must keep.

## 1. State fields

| Field | Type | Initial | Persisted | Notes |
| --- | --- | --- | --- | --- |
| `selectedVenueId` | string | `event.defaultVenueId` | no | |
| `selectedAreaId` | string | first Career Expo area | no | Area, not track |
| `selectedTrackId` | string | `career-expo` | no | Mirrors the area's track |
| `selectedDayId` | string | first event day | no | Day filter for sessions |
| `selectedBoothId` | string \| null | `null` | no | Drives detail + camera |
| `selectedFacilityId` | string \| null | `null` | no | Entrance / registration / photobooth / photo wall / info center / panggung |
| `hoveredBoothId` | string \| null | `null` | no | Tooltip + glow only |
| `sidebarMode` | `list \| detail \| facility \| search` | `list` | no | |
| `sidebarTab` | `home \| search \| saved \| stats \| info` | `home` | no | |
| `searchQuery` | string | `""` | no | |
| `searchFilters` | `{ tags: string[]; types: string[] }` | empty | no | Sector / role facets |
| `isMobileSheetOpen` | boolean | `false` | no | Legacy flag; sheet height is local |
| `gikMode` | boolean | `true` | no | Overview camera |
| `mapView` | `{ center, zoom, bearing, pitch }` | GIK overview | no | Written on `moveend` |
| `bookmarkedIds` | string[] | `[]` | **yes** (`icd-2026-map`) | Only persisted slice |

## 2. Derived view state

| Region | Which state decides it |
| --- | --- |
| Rail / mobile tab highlight | `sidebarTab` |
| Sidebar / sheet body | `saved`/`stats`/`info` win in `renderMainContent`; else `sidebarMode === 'facility'` → `FacilityDetail`; `'detail'` → `BoothDetail`; else `VenueList` |
| Live card | `sidebarTab === 'home' && sidebarMode !== 'detail'` |
| Search results | `searchQuery` **or** active `searchFilters` in `VenueList` |
| Track pills | `selectedAreaId` + `gikMode` (GIK wins when true) |
| Hall card | `selectedVenueId` / `selectedTrackId` |
| Booth glow + tooltip | `hoveredBoothId ?? selectedBoothId` |
| Camera | `gikMode`, `selectedBoothId`, `selectedAreaId`/track (4 owners below) |
| Tray height (mobile) | local state in `MobileBottomSheet`: peek / 30% (detail) / 82% |

## 3. Transitions

| Event | Mutations | Camera |
| --- | --- | --- |
| `setSelectedVenue(v)` | venue, first area+track, booth=null, mode `list` | area effect → `fitHall` |
| `setSelectedArea(a)` | area + its track, booth=null, mode `list` | area effect → `fitHall` |
| `setSelectedTrack(t)` | same as area | area effect → `fitHall` |
| `setSelectedDay(d)` | day only | — |
| `selectBooth(id)` | booth, venue/area/track from booth, `gikMode=false`, `sidebarTab='home'`, mode `detail` | booth effect → `easeTo` (zoom ≥19.4) |
| `selectBooth(null)` | booth=null, facility=null, mode `list` | none (booth effect no-ops) |
| `selectFacility(id)` | facility=id, booth=null, `gikMode=false`, tab `home`, mode `facility` | GIK-off fit |
| `selectFacility(null)` | facility=null, mode `detail` if booth else `list` | — |
| `hoverBooth(id)` | hovered id | tooltip reposition only |
| `setSearchQuery(q)` | query; mode `search` if q, else `detail` if booth, else `list` | — |
| `toggleSearchFilter` / `clearSearchFilters` | filters only | — |
| `setSidebarTab(tab)` | tab; non-home/search also clears query + mode `list` (keeps booth) | Home handler also clears booth + filters |
| `setGikMode(true)` | gik on | `easeTo` GIK overview (16.3) |
| `setGikMode(false)` | gik off | `fitHall` unless a booth is selected |
| Track pill / dropdown | `setSelectedArea` (or `setGikMode`) | above |
| Hall C1 card | GIK: `setSelectedArea(career-expo)` + `setGikMode(false)`; else `fitHall` | one fit |
| Map booth click | `selectBooth(id)` | booth fly-to |
| Map empty click | `selectBooth(null)` | none; mobile lowers tray |
| URL `?booth=id` (mount) | valid id → `selectBooth`; invalid → home | booth fly-to |

## 4. URL map

| UI state | URL |
| --- | --- |
| Home / list | `/map` |
| Booth detail | `/map?booth=<id>` (read once on mount) |
| Search / filters / tabs | **not serialized** |
| Track / area / day | **not serialized** |

Known gap: no `popstate`/`hashchange` replay, no URL writes when the user
selects a booth (the share hook builds links separately).

## 5. Invariants

1. A selected booth always belongs to `selectedAreaId`; selecting an area
   clears a foreign booth.
2. `selectedTrackId` always matches `selectedAreaId`'s track.
3. One camera owner per action: booth fly-to suppresses hall fits; GIK
   toggles suppress hall fits while a booth is selected.
4. Every detail has an exit: Close, `selectBooth(null)`, Home, map empty
   click, Esc (sheet).
5. Detail renders only through `sidebarMode === 'detail'` **or
   `'facility'`**, and the sidebar/sheet is on `home`; `selectBooth` and
   `selectFacility` set both, and each clears the other selection.
6. No `padding` is left on the map; mobile uses a transient `offset`.
7. Only `bookmarkedIds` restores across reloads.

## 6. Gaps / risks (report only)

- **QuickFind is inert**: the chips only emit analytics; they do not pan,
  filter, or select anything.
- `setSidebarTab('saved'|'stats'|'info')` leaves `selectedBoothId` set, so
  the map keeps a glow while the panel shows another tab. Home clears it.
- Booth selection does not write the URL; `?booth=` is read once and never
  updated, so Back/Forward cannot replay in-page selections.
- Search query, facets, track, area, day, and `gikMode` are not URL state.
- `isMobileSheetOpen` exists but the sheet's real state is local height.
- No `webglcontextrestored` recovery path beyond a console warning.

## 7. Test checklist (matrix)

For each row, verify: camera sane, selected row/booth agree, an exit exists,
no console error, tray at the right height (mobile).

| # | Path | Expect |
| --- | --- | --- |
| 1 | Home → booth (list) → Close | detail opens, rail shows Home, closes to list |
| 2 | Info tab → booth from map | tab switches to Home + detail (not Info) |
| 3 | Stats tab → booth → Home | detail cannot hide behind Stats; Home resets |
| 4 | Search query → facet → row | results filtered by both; detail opens |
| 5 | Filters only (no query) → row | results branch shows; detail opens |
| 6 | GIK → Hall C1 card | GIK off, Career Expo pill active, hall fit |
| 7 | GIK → booth from map | track switches to booth area, GIK off |
| 8 | Track dropdown → area | booth cleared, hall fit |
| 9 | Day switch with a booth open | selection is not cleared (gap: verify copy) |
| 10 | `?booth=<valid>` | detail + camera on load |
| 11 | `?booth=<bad>` | home state, no half-applied selection |
| 12 | Reload with bookmarks | bookmarks restored, nothing else |
| 13 | Mobile: booth → tray | tray 30%, scrollable, Close lowers to peek |
| 14 | Mobile: drag down from detail | peek; drag up | capped at 30% in detail |
| 15 | Back/Forward after in-page selection | no change (documented gap) |
| 16 | Click Entrance / Registration / Interactive / Photo wall | facility bento opens, tray 30%, map stays on hall |
| 17 | Facility open → click a booth | booth detail replaces it; glow follows booth |
| 18 | Facility open → empty-map click / Home | facility closes, tray lowers |
