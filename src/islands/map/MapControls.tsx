import { memo, type RefObject } from 'react';
import type maplibregl from 'maplibre-gl';
import { Crosshair } from 'lucide-react';
import ZoomButtons from '../../components/map/ZoomButtons';
import CompassButton from '../../components/map/CompassButton';
import { ui } from '../../lib/data';

type MapControlsProps = {
  mapRef: RefObject<maplibregl.Map | null>;
  compassNeedleRef: RefObject<SVGGElement | null>;
  fitHall: () => void;
};

/**
 * Map camera controls. Kept behind `memo` with only stable props (refs and
 * the fit callback) so tooltip/hover and selection renders never reconcile
 * this subtree.
 */
function MapControls({ mapRef, compassNeedleRef, fitHall }: MapControlsProps) {
  return (
    <div
      data-layout-tune="map-controls"
      className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2"
    >
      <ZoomButtons
        onZoomIn={() => mapRef.current?.zoomIn({ duration: 200 })}
        onZoomOut={() => mapRef.current?.zoomOut({ duration: 200 })}
        zoomInLabel={ui.map.zoomInLabel}
        zoomOutLabel={ui.map.zoomOutLabel}
      />
      <CompassButton
        onClick={() => mapRef.current?.rotateTo(0, { duration: 300 })}
        label={ui.map.compassLabel}
        needleRef={compassNeedleRef}
      />
      <button
        type="button"
        onClick={fitHall}
        aria-label={ui.map.recenterLabel}
        title={ui.map.recenterLabel}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#34343a] bg-[#141416] text-white transition-[transform,colors] hover:border-[#4a4a52] active:scale-95 md:h-10 md:w-10"
      >
        <Crosshair size={17} strokeWidth={1.7} />
      </button>
    </div>
  );
}

export default memo(MapControls);
