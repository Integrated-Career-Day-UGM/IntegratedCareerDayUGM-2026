import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapViewState } from '../types/map';
import { event, getVenue, getArea, getBooth } from '../lib/data';
import { track } from '../lib/analytics';

type SidebarMode = 'list' | 'detail' | 'search';
type SidebarTab = 'home' | 'search' | 'saved' | 'stats' | 'info';

interface MapState {
  // Selection
  selectedVenueId: string;
  selectedAreaId: string;
  selectedTrackId: string;
  selectedDayId: string;
  selectedBoothId: string | null;
  hoveredBoothId: string | null;

  // UI
  sidebarMode: SidebarMode;
  sidebarTab: SidebarTab;
  searchQuery: string;
  isMobileSheetOpen: boolean;

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
  hoverBooth: (boothId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSidebarMode: (mode: SidebarMode) => void;
  setSidebarTab: (tab: SidebarTab) => void;
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
      hoveredBoothId: null,
      sidebarMode: 'list',
      sidebarTab: 'home',
      searchQuery: '',
      isMobileSheetOpen: false,
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
          sidebarMode: 'list',
        });
      },

      setSelectedDay: (dayId) => {
        track('day.switch', { dayId });
        set({ selectedDayId: dayId });
      },

      selectBooth: (boothId) => {
        if (boothId) {
          const booth = getBooth(boothId);
          track('booth.select', { boothId, companyId: booth?.companyId });
        }
        set({ selectedBoothId: boothId, sidebarMode: boothId ? 'detail' : 'list' });
      },

      hoverBooth: (boothId) => set({ hoveredBoothId: boothId }),

      setSearchQuery: (query) => {
        if (query) {
          track('search.query', { query });
        }
        set({
          searchQuery: query,
          sidebarMode: query ? 'search' : get().selectedBoothId ? 'detail' : 'list',
        });
      },

      setSidebarMode: (mode) => set({ sidebarMode: mode }),

      setSidebarTab: (tab) => {
        track('sidebar.tab.switch', { tab });
        set({ sidebarTab: tab });
        // Clear search when leaving search-centric contexts to avoid confusion.
        if (tab !== 'home' && tab !== 'search') {
          set({ searchQuery: '', sidebarMode: 'list' });
        }
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
