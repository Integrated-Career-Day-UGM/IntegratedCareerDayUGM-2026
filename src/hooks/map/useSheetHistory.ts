import { useEffect } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { getBooth } from '../../lib/data';

const DETAIL_STATE = 'icd-detail';

const isDetailMode = () => {
  const mode = useMapStore.getState().sidebarMode;
  return mode === 'detail' || mode === 'facility';
};

const detailKey = () => {
  const state = useMapStore.getState();
  return (
    state.selectedBoothId ??
    state.selectedWalkInRoomId ??
    state.selectedFacilityId ??
    ''
  );
};

/**
 * Wires detail cards into browser history so Back closes the card instead of
 * leaving the map page.
 *
 * - A card opened by a gesture pushes one entry; closing pops it.
 * - Card → card swaps replace (no history spam).
 * - A `?booth=` deep link on mount replaces the current entry instead of
 *   pushing: WebKit ignores gesture-less pushState on load, and a pushed
 *   entry would make the first Back exit the site. The deep-link open runs
 *   in the effect below, before the store subscription exists, so it is
 *   never mistaken for a gesture open.
 */
export function useSheetHistory() {
  const selectBooth = useMapStore((s) => s.selectBooth);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const boothId = params.get('booth');
    if (!boothId || !getBooth(boothId)) return;
    // No entry is created for the landing card — just normalise the current
    // one (replaceState, never pushState, on a gesture-less load).
    window.history.replaceState(window.history.state, '');
    selectBooth(boothId);
  }, [selectBooth]);

  useEffect(() => {
    let wasOpen = isDetailMode();
    let lastKey = detailKey();
    let pushed = false;

    const sync = () => {
      const open = isDetailMode();
      const key = detailKey();

      if (open && !wasOpen) {
        window.history.pushState({ icdSheet: DETAIL_STATE }, '');
        pushed = true;
      } else if (open && wasOpen && key !== lastKey) {
        // A second card inside the open detail is a swap, not a new screen.
        if (pushed) window.history.replaceState({ icdSheet: DETAIL_STATE }, '');
      } else if (!open && wasOpen) {
        if (pushed) {
          pushed = false;
          window.history.back();
        }
      }
      wasOpen = open;
      lastKey = key;
    };

    const onPop = (event: PopStateEvent) => {
      if (!isDetailMode()) return;
      if ((event.state as { icdSheet?: string } | null)?.icdSheet === DETAIL_STATE) return;
      pushed = false;
      useMapStore.getState().closeDetail();
    };

    const unsubscribe = useMapStore.subscribe(sync);
    window.addEventListener('popstate', onPop);
    return () => {
      unsubscribe();
      window.removeEventListener('popstate', onPop);
    };
  }, []);
}
