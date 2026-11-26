import { memo, useLayoutEffect, type RefObject } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { getWalkInBookings } from '../../lib/data';
import MapTooltip from '../../components/map/MapTooltip';
import FacilityTooltip from '../../components/map/FacilityTooltip';

type MapTooltipHostProps = {
  tooltipRef: RefObject<HTMLDivElement | null>;
  positionTooltipRef: RefObject<() => void>;
};

/**
 * Owns the screen-space tooltip subscriptions. Hover changes only re-render
 * this host (plus the floor-plan overlay), never the whole map island.
 *
 * The wrapper stays mounted so `positionTooltip` always has a stable node;
 * opacity is written imperatively by the map render loop.
 */
function MapTooltipHost({
  tooltipRef,
  positionTooltipRef,
}: MapTooltipHostProps) {
  const hoveredBoothId = useMapStore((s) => s.hoveredBoothId);
  const selectedBoothId = useMapStore((s) => s.selectedBoothId);
  const selectedFacilityId = useMapStore((s) => s.selectedFacilityId);
  const selectedWalkInRoomId = useMapStore((s) => s.selectedWalkInRoomId);
  const selectedDayId = useMapStore((s) => s.selectedDayId);

  const activeBoothId = hoveredBoothId ?? selectedBoothId;
  const walkInBooking = selectedWalkInRoomId
    ? getWalkInBookings(selectedDayId, selectedWalkInRoomId)[0]
    : undefined;

  // Content or anchor changed: write the screen transform after commit but
  // before paint, so hover never paints a frame at the old position.
  useLayoutEffect(() => {
    positionTooltipRef.current();
  }, [
    hoveredBoothId,
    selectedBoothId,
    selectedFacilityId,
    selectedWalkInRoomId,
    selectedDayId,
    positionTooltipRef,
  ]);

  return (
    <div
      ref={tooltipRef}
      data-layout-tune="map-tooltip"
      className="absolute top-0 left-0 z-20"
      style={{ opacity: 0, willChange: 'transform' }}
    >
      {activeBoothId ? (
        <MapTooltip boothId={activeBoothId} x={0} y={0} />
      ) : walkInBooking ? (
        <MapTooltip
          walkIn={{
            room: walkInBooking.room,
            companyId: walkInBooking.companyId,
            companyName: walkInBooking.companyName,
          }}
          x={0}
          y={0}
        />
      ) : selectedFacilityId ? (
        <FacilityTooltip facilityId={selectedFacilityId} />
      ) : null}
    </div>
  );
}

export default memo(MapTooltipHost);
