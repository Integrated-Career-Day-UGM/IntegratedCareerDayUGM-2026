import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapViewState } from '../types/map';
import {
  event,
  venues,
  getVenue,
  getArea,
  getBooth,
  walkInSessions,
} from '../lib/data';
import { WALKIN_2F, type WalkIn2FConfig } from '../lib/map/floorplan';
import { track } from '../lib/analytics';

type SidebarMode = 'list' | 'detail' | 'facility' | 'search' | 'changelog';
type SidebarTab = 'home' | 'search' | 'saved' | 'stats' | 'info';
type SearchFilters = { tags: string[]; types: string[] };

interface MapState {
  // Selection
  selectedVenueId: string;
  selectedAreaId: string;
  selectedTrackId: string;
  selectedDayId: string;
  selectedBoothId: string | null;
  selectedFacilityId: string | null;
  hoveredBoothId: string | null;
  /** Selected 2F walk-in room (F1–F10 id); exclusive with booth/facility. */
  selectedWalkInRoomId: string | null;
  /**
   * Tab the user was on before a detail card opened. Closing the card returns
   * there (search results, saved list) instead of dumping them on Home.
   */
  detailOriginTab: SidebarTab | null;

  // UI
  sidebarMode: SidebarMode;
  sidebarTab: SidebarTab;
  searchQuery: string;
  /** Faceted search: company sectors (tags) and opening types. */
  searchFilters: SearchFilters;
  /** Search result surface: everything, or one type. */
  searchKind: 'all' | 'company' | 'opening' | 'session';
  /** GIK mode: zoomed-out event overview; will host geojson pathfinding. */
  gikMode: boolean;

  // Map view
  mapView: MapViewState;

  // DEV-tuned second-floor frame transform
  walkIn2FConfig: WalkIn2FConfig;

  // Bookmarks
  bookmarkedIds: string[];

  // Actions
  setSelectedVenue: (venueId: string) => void;
  setSelectedArea: (areaId: string) => void;
  setSelectedTrack: (trackId: string) => void;
  setSelectedDay: (dayId: string) => void;
  selectBooth: (boothId: string | null) => void;
  selectFacility: (facilityId: string | null) => void;
  hoverBooth: (boothId: string | null) => void;
  /**
   * Select a walk-in room on the 2F plan. An optional `dayId` lets
   * cross-links (session rows on a company card) land on the day the
   * booking actually exists.
   */
  selectWalkInRoom: (roomId: string | null, dayId?: string) => void;
  /** Close booth / room / facility detail and restore the origin tab. */
  closeDetail: () => void;
  setSearchQuery: (query: string) => void;
  toggleSearchFilter: (kind: keyof SearchFilters, value: string) => void;
  clearSearchFilters: () => void;
  setSearchKind: (kind: 'all' | 'company' | 'opening' | 'session') => void;
  setSidebarMode: (mode: SidebarMode) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  /** Changelog page (a sub-page of the sidebar/tray, not a tab). */
  openChangelog: () => void;
  closeChangelog: () => void;
  setGikMode: (on: boolean) => void;
  setMapView: (view: Partial<MapViewState>) => void;
  setWalkIn2FConfig: (config: WalkIn2FConfig) => void;
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
}

const defaultVenueId = event.defaultVenueId;
const defaultVenue = getVenue(defaultVenueId);
const defaultArea = defaultVenue?.areas.find((a) => a.trackId === 'career-expo');
const defaultTrackId = defaultArea?.trackId ?? event.tracks[0].id;
const defaultAreaId = defaultArea?.id ?? defaultVenue?.areas[0].id ?? '';

const originTabFor = (state: {
  sidebarMode: SidebarMode;
  sidebarTab: SidebarTab;
  detailOriginTab: SidebarTab | null;
}): SidebarTab =>
  ['detail', 'facility'].includes(state.sidebarMode)
    ? state.detailOriginTab ?? state.sidebarTab
    : state.sidebarTab;

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      selectedVenueId: defaultVenueId,
      selectedAreaId: defaultAreaId,
      selectedTrackId: defaultTrackId,
      selectedDayId: event.days[0].id,
      selectedBoothId: null,
      selectedFacilityId: null,
      hoveredBoothId: null,
      selectedWalkInRoomId: null,
      detailOriginTab: null,
      sidebarMode: 'list',
      sidebarTab: 'home',
      searchQuery: '',
      searchFilters: { tags: [], types: [] },
      searchKind: 'all',
      gikMode: true,
      mapView: {
        center: [110.3761, -7.7743],
        zoom: 19,
        bearing: 0,
        pitch: 0,
      },
      walkIn2FConfig: WALKIN_2F,
      bookmarkedIds: [],

      setSelectedVenue: (venueId) => {
        const venue = getVenue(venueId);
        const firstArea = venue?.areas[0];
        set({
          selectedVenueId: venueId,
          selectedAreaId: firstArea?.id ?? '',
          selectedTrackId: firstArea?.trackId ?? '',
          selectedBoothId: null,
          selectedFacilityId: null,
          selectedWalkInRoomId: null,
          sidebarMode: 'list',
        });
      },

      setSelectedArea: (areaId) => {
        const area = getArea(get().selectedVenueId, areaId);
        if (!area) return;
        track('area.switch', { areaId, trackId: area.trackId });
        set({
          selectedAreaId: areaId,
          selectedTrackId: area.trackId,
          selectedBoothId: null,
          selectedFacilityId: null,
          selectedWalkInRoomId: null,
          sidebarMode: 'list',
        });
      },

      setSelectedTrack: (trackId) => {
        const venue = getVenue(get().selectedVenueId);
        const area = venue?.areas.find((a) => a.trackId === trackId);
        if (!area) return;
        track('area.switch', { areaId: area.id, trackId });
        set({
          selectedTrackId: trackId,
          selectedAreaId: area.id,
          selectedBoothId: null,
          selectedFacilityId: null,
          selectedWalkInRoomId: null,
          sidebarMode: 'list',
        });
      },

      setSelectedDay: (dayId) => {
        track('day.switch', { dayId });
        // A selected walk-in room only makes sense while it is booked on the
        // visible day; switching days drops it when the new day has no
        // booking (the sidebar detail and tooltip would describe nothing).
        const room = get().selectedWalkInRoomId;
        if (
          room &&
          !walkInSessions.some((s) => s.dayId === dayId && s.room === room)
        ) {
          set({
            selectedDayId: dayId,
            selectedWalkInRoomId: null,
            ...(get().sidebarMode === 'detail' ? { sidebarMode: 'list' } : {}),
          });
          return;
        }
        set({ selectedDayId: dayId });
      },

      selectBooth: (boothId) => {
        if (!boothId) {
          const current = get();
          const stillDetail = Boolean(current.selectedWalkInRoomId);
          set({
            selectedBoothId: null,
            selectedFacilityId: null,
            sidebarMode: stillDetail ? 'detail' : 'list',
            sidebarTab: stillDetail
              ? current.sidebarTab
              : current.detailOriginTab ?? current.sidebarTab,
            detailOriginTab: stillDetail ? current.detailOriginTab : null,
          });
          return;
        }
        const booth = getBooth(boothId);
        track('booth.select', { boothId, companyId: booth?.companyId });
        if (!booth) {
          // Unknown id (bad ?booth= URL, removed booth) — clean exit instead
          // of a half-applied selection.
          get().closeDetail();
          return;
        }
        const current = get();
        // The venue/track state follows the booth: the tab switcher must
        // reflect the venue the clicked item belongs to. Saved rows, search
        // results and ?booth= links can all cross tracks, and without this
        // the sidebar shows a booth while the map stays on another venue.
        const venue = venues.find((v) => v.areas.some((a) => a.id === booth.areaId));
        const area = venue?.areas.find((a) => a.id === booth.areaId);
        set({
          selectedBoothId: boothId,
          selectedFacilityId: null,
          selectedWalkInRoomId: null,
          selectedVenueId: venue?.id ?? get().selectedVenueId,
          selectedAreaId: area?.id ?? get().selectedAreaId,
          selectedTrackId: area?.trackId ?? get().selectedTrackId,
          gikMode: false,
          // Keep the tab the card was opened from; closing returns there.
          detailOriginTab: originTabFor(current),
          sidebarMode: 'detail',
        });
      },

      selectFacility: (facilityId) => {
        const current = get();
        if (!facilityId) {
          const stillDetail = Boolean(current.selectedBoothId || current.selectedWalkInRoomId);
          set({
            selectedFacilityId: null,
            sidebarMode: stillDetail ? 'detail' : 'list',
            sidebarTab: stillDetail
              ? current.sidebarTab
              : current.detailOriginTab ?? current.sidebarTab,
            detailOriginTab: stillDetail ? current.detailOriginTab : null,
          });
          return;
        }
        set({
          selectedFacilityId: facilityId,
          selectedBoothId: null,
          selectedWalkInRoomId: null,
          gikMode: false,
          detailOriginTab: originTabFor(current),
          sidebarMode: 'facility',
        });
      },

      closeDetail: () => {
        const current = get();
        set({
          selectedBoothId: null,
          selectedFacilityId: null,
          selectedWalkInRoomId: null,
          sidebarMode: 'list',
          sidebarTab: current.detailOriginTab ?? current.sidebarTab,
          detailOriginTab: null,
        });
      },

      hoverBooth: (boothId) => set({ hoveredBoothId: boothId }),

      selectWalkInRoom: (roomId, dayId) => {
        const current = get();
        if (!roomId) {
          // Deselect (map tap, close button, tab switch) — mirror selectBooth:
          // keep a booth detail open if one is somehow active.
          const stillDetail = Boolean(current.selectedBoothId);
          set({
            selectedWalkInRoomId: null,
            sidebarMode: stillDetail ? 'detail' : 'list',
            sidebarTab: stillDetail
              ? current.sidebarTab
              : current.detailOriginTab ?? current.sidebarTab,
            detailOriginTab: stillDetail ? current.detailOriginTab : null,
          });
          return;
        }
        const targetDay = dayId ?? get().selectedDayId;
        // A bilik can host several companies across the day's slots — any
        // booking on the target day makes the room selectable; the detail
        // card renders one card per booking.
        const bookings = walkInSessions.filter(
          (s) => s.room === roomId && s.dayId === targetDay,
        );
        // Only booked rooms are selectable — an open room behaves like the
        // empty map (a tap clears the selection instead).
        if (bookings.length === 0) return;
        track('walkin.room.select', {
          roomId,
          dayId: targetDay,
          companyIds: bookings.map((b) => b.companyId),
        });
        // Same rule as selectBooth: the track/area follow the selection so
        // the sidebar detail and the visible plan can never disagree —
        // session rows on a company card can link here from the career-expo
        // tab, and they carry the booking's day so the room is booked there.
        const venue = venues.find((v) =>
          v.areas.some((a) => a.trackId === 'walk-in-interview'),
        );
        const area = venue?.areas.find((a) => a.trackId === 'walk-in-interview');
        set({
          selectedWalkInRoomId: roomId,
          selectedBoothId: null,
          selectedFacilityId: null,
          selectedDayId: targetDay,
          selectedAreaId: area?.id ?? get().selectedAreaId,
          selectedTrackId: area?.trackId ?? get().selectedTrackId,
          gikMode: false,
          detailOriginTab: originTabFor(current),
          sidebarMode: 'detail',
        });
      },

      setSearchQuery: (query) => {
        if (query) {
          track('search.query', { query });
        }
        set({
          searchQuery: query,
          sidebarMode: query
            ? 'search'
            : get().selectedBoothId || get().selectedWalkInRoomId
              ? 'detail'
              : get().selectedFacilityId
                ? 'facility'
                : 'list',
        });
      },

      toggleSearchFilter: (kind, value) => {
        const current = get().searchFilters[kind];
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        set({ searchFilters: { ...get().searchFilters, [kind]: next } });
      },

      clearSearchFilters: () => set({ searchFilters: { tags: [], types: [] } }),

      setSearchKind: (kind) => set({ searchKind: kind }),

      setSidebarMode: (mode) => set({ sidebarMode: mode }),

      openChangelog: () => set({ sidebarMode: 'changelog' }),

      closeChangelog: () => set({ sidebarMode: 'list' }),

      setSidebarTab: (tab) => {
        track('sidebar.tab.switch', { tab });
        // Tabs are views, not overlays: any detail card (booth, room,
        // facility) closes on a tab switch — a hidden selection behind
        // another surface is a dead end.
        set({
          sidebarTab: tab,
          sidebarMode: 'list',
          selectedBoothId: null,
          selectedFacilityId: null,
          selectedWalkInRoomId: null,
          detailOriginTab: null,
          ...(tab !== 'home' && tab !== 'search' ? { searchQuery: '' } : {}),
        });
      },

      setGikMode: (on) => {
        track('gik.mode', { on });
        if (!on) {
          set({ gikMode: false });
          return;
        }
        // GIK is the career-expo overview: entering it from the walk-in (2F)
        // plan must also route the layout back to the first floor, otherwise
        // the camera only zooms out over the wrong plan.
        const current = get();
        const venue = getVenue(current.selectedVenueId);
        const expoArea =
          venue?.areas.find((a) => a.trackId === 'career-expo') ?? venue?.areas[0];
        set({
          gikMode: true,
          ...(expoArea
            ? {
                selectedTrackId: expoArea.trackId,
                selectedAreaId: expoArea.id,
                selectedBoothId: null,
                selectedFacilityId: null,
                selectedWalkInRoomId: null,
                detailOriginTab: null,
                sidebarMode: 'list' as const,
              }
            : {}),
        });
      },

      setMapView: (view) => set({ mapView: { ...get().mapView, ...view } }),

      setWalkIn2FConfig: (config) => set({ walkIn2FConfig: config }),

      toggleBookmark: (id) => {
        const current = get().bookmarkedIds;
        const isAdding = !current.includes(id);
        const next = isAdding
          ? [...current, id]
          : current.filter((x) => x !== id);
        const booth = getBooth(id);
        track(isAdding ? 'bookmark.add' : 'bookmark.remove', {
          boothId: id,
          companyId: booth?.companyId,
        });
        set({ bookmarkedIds: next });
      },

      isBookmarked: (id) => get().bookmarkedIds.includes(id),
    }),
    {
      name: 'icd-2026-map',
      partialize: (state) => ({
      bookmarkedIds: state.bookmarkedIds,
      walkIn2FConfig: state.walkIn2FConfig,
    }),
    }
  )
);
