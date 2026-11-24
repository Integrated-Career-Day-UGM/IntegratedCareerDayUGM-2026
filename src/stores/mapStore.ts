import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapViewState } from '../types/map';
import { event, venues, getVenue, getArea, getBooth } from '../lib/data';
import { track } from '../lib/analytics';

type SidebarMode = 'list' | 'detail' | 'facility' | 'search';
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

  // UI
  sidebarMode: SidebarMode;
  sidebarTab: SidebarTab;
  searchQuery: string;
  /** Faceted search: company sectors (tags) and opening types. */
  searchFilters: SearchFilters;
  isMobileSheetOpen: boolean;
  /** GIK mode: zoomed-out event overview; will host geojson pathfinding. */
  gikMode: boolean;

  // Map view
  mapView: MapViewState;

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
  setSearchQuery: (query: string) => void;
  toggleSearchFilter: (kind: keyof SearchFilters, value: string) => void;
  clearSearchFilters: () => void;
  setSidebarMode: (mode: SidebarMode) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setGikMode: (on: boolean) => void;
  openMobileSheet: () => void;
  closeMobileSheet: () => void;
  setMapView: (view: Partial<MapViewState>) => void;
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
}

const defaultVenueId = event.defaultVenueId;
const defaultVenue = getVenue(defaultVenueId);
const defaultArea = defaultVenue?.areas.find((a) => a.trackId === 'career-expo');
const defaultTrackId = defaultArea?.trackId ?? event.tracks[0].id;
const defaultAreaId = defaultArea?.id ?? defaultVenue?.areas[0].id ?? '';

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
      sidebarMode: 'list',
      sidebarTab: 'home',
      searchQuery: '',
      searchFilters: { tags: [], types: [] },
      isMobileSheetOpen: false,
      gikMode: true,
      mapView: {
        center: [110.3761, -7.7743],
        zoom: 19,
        bearing: 0,
        pitch: 0,
      },
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
          sidebarMode: 'list',
        });
      },

      setSelectedDay: (dayId) => {
        track('day.switch', { dayId });
        set({ selectedDayId: dayId });
      },

      selectBooth: (boothId) => {
        if (!boothId) {
          set({ selectedBoothId: null, selectedFacilityId: null, sidebarMode: 'list' });
          return;
        }
        const booth = getBooth(boothId);
        track('booth.select', { boothId, companyId: booth?.companyId });
        if (!booth) {
          // Unknown id (bad ?booth= URL, removed booth) — fall back to the
          // home state instead of a half-applied selection.
          set({ selectedBoothId: null, selectedFacilityId: null, sidebarMode: 'list' });
          return;
        }
        // The venue/track state follows the booth: the tab switcher must
        // reflect the venue the clicked item belongs to. Saved rows, search
        // results and ?booth= links can all cross tracks, and without this
        // the sidebar shows a booth while the map stays on another venue.
        const venue = venues.find((v) => v.areas.some((a) => a.id === booth.areaId));
        const area = venue?.areas.find((a) => a.id === booth.areaId);
        set({
          selectedBoothId: boothId,
          selectedFacilityId: null,
          selectedVenueId: venue?.id ?? get().selectedVenueId,
          selectedAreaId: area?.id ?? get().selectedAreaId,
          selectedTrackId: area?.trackId ?? get().selectedTrackId,
          gikMode: false,
          sidebarTab: 'home',
          sidebarMode: 'detail',
        });
      },

      selectFacility: (facilityId) => {
        if (!facilityId) {
          set({
            selectedFacilityId: null,
            sidebarMode: get().selectedBoothId ? 'detail' : 'list',
          });
          return;
        }
        set({
          selectedFacilityId: facilityId,
          selectedBoothId: null,
          gikMode: false,
          sidebarTab: 'home',
          sidebarMode: 'facility',
        });
      },

      hoverBooth: (boothId) => set({ hoveredBoothId: boothId }),

      setSearchQuery: (query) => {
        if (query) {
          track('search.query', { query });
        }
        set({
          searchQuery: query,
          sidebarMode: query
            ? 'search'
            : get().selectedBoothId
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

      setSidebarMode: (mode) => set({ sidebarMode: mode }),

      setSidebarTab: (tab) => {
        track('sidebar.tab.switch', { tab });
        // Tabs are views, not overlays: never leave a hidden booth/facility
        // selection behind a saved/stats/info/search surface (dead-end state).
        if (tab === 'home') {
          set({
            sidebarTab: tab,
            sidebarMode: 'list',
            selectedBoothId: null,
            selectedFacilityId: null,
          });
          return;
        }
        if (tab === 'search') {
          set({
            sidebarTab: tab,
            sidebarMode: 'list',
            selectedBoothId: null,
            selectedFacilityId: null,
          });
          return;
        }
        set({
          sidebarTab: tab,
          searchQuery: '',
          sidebarMode: 'list',
          selectedBoothId: null,
          selectedFacilityId: null,
        });
      },

      setGikMode: (on) => {
        track('gik.mode', { on });
        set({ gikMode: on });
      },

      openMobileSheet: () => set({ isMobileSheetOpen: true }),
      closeMobileSheet: () => set({ isMobileSheetOpen: false }),

      setMapView: (view) => set({ mapView: { ...get().mapView, ...view } }),

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
      partialize: (state) => ({ bookmarkedIds: state.bookmarkedIds }),
    }
  )
);
