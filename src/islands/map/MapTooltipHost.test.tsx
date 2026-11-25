import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MapTooltipHost from './MapTooltipHost';
import { useMapStore } from '../../stores/mapStore';

const original = useMapStore.getState();

afterEach(() => {
  act(() => {
    useMapStore.setState({
      hoveredBoothId: original.hoveredBoothId,
      selectedBoothId: original.selectedBoothId,
      selectedFacilityId: original.selectedFacilityId,
      selectedWalkInRoomId: original.selectedWalkInRoomId,
      selectedDayId: original.selectedDayId,
    });
  });
});

describe('MapTooltipHost', () => {
  it('renders hovered booths and falls back to the selected booth', () => {
    const tooltipRef = createRef<HTMLDivElement>();
    const positionTooltipRef = { current: vi.fn() };

    const { container } = render(
      <MapTooltipHost
        tooltipRef={tooltipRef}
        positionTooltipRef={positionTooltipRef}
      />,
    );

    act(() => {
      useMapStore.setState({
        hoveredBoothId: 'c2',
        selectedBoothId: null,
        selectedFacilityId: null,
        selectedWalkInRoomId: null,
      });
    });

    expect(container.textContent).toContain('C2');
    expect(container.textContent).toContain('Monee Indonesia');
    expect(positionTooltipRef.current).toHaveBeenCalled();

    act(() => {
      useMapStore.setState({
        hoveredBoothId: null,
        selectedBoothId: 'c1',
      });
    });

    expect(screen.getByText('C1')).toBeInTheDocument();
    expect(container.textContent).toContain('Hutama Karya');
  });

  it('pins the selected walk-in room from the selected day', () => {
    const tooltipRef = createRef<HTMLDivElement>();
    const positionTooltipRef = { current: vi.fn() };

    const { container } = render(
      <MapTooltipHost
        tooltipRef={tooltipRef}
        positionTooltipRef={positionTooltipRef}
      />,
    );

    act(() => {
      useMapStore.setState({
        hoveredBoothId: null,
        selectedBoothId: null,
        selectedFacilityId: null,
        selectedWalkInRoomId: 'F1',
        selectedDayId: 'd1',
      });
    });

    expect(container.textContent).toContain('F1');
    expect(container.textContent).toContain('Teach First');
    expect(positionTooltipRef.current).toHaveBeenCalled();
  });
});
