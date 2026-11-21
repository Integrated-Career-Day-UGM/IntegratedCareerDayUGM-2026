import { useEffect } from 'react';
import { useMapStore } from '../stores/mapStore';
import { getBooth } from '../lib/data';

export function useBoothFromUrl() {
  const { selectBooth } = useMapStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const boothId = params.get('booth');
    if (boothId && getBooth(boothId)) {
      selectBooth(boothId);
    }
  }, [selectBooth]);
}
