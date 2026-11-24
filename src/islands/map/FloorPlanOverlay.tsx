import { forwardRef, useMemo } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { facilities } from '../../lib/data';
import {
  BOOTH_SHAPES,
  FACILITY_FRAME_POINTS,
  FRAME_HEIGHT,
  FRAME_WIDTH,
  PLAN_SPRITES,
} from '../../lib/map/floorplan';

/**
 * Hall C1 floor-plan, implemented from the Figma frame "Frame 1686561279"
 * (node 1729:23400, 818 x 820). The root element is warped onto the map by
 * MapLibreMap via a per-frame CSS matrix3d, so every child simply uses frame
 * pixel coordinates. Booth boxes are interactive and wired to the store.
 */
const FloorPlanOverlay = forwardRef<HTMLDivElement>(function FloorPlanOverlay(_, ref) {
  const hoveredBoothId = useMapStore((s) => s.hoveredBoothId);
  const selectedBoothId = useMapStore((s) => s.selectedBoothId);
  const selectedFacilityId = useMapStore((s) => s.selectedFacilityId);
  const activeBoothId = hoveredBoothId ?? selectedBoothId;

  // The plan's art never changes: build it once so hover/selection only
  // re-renders the booth chips. (The overlay is pointer-events-none;
  // MapLibreMap hit-tests picks through the inverse homography.)
  const staticPlan = useMemo(
    () => (
      <>
      {/* Hall + pillars — exact Figma export (node 2047:28177), placed by a
          similarity transform that maps its long right edge onto the old
          sprite's right edge (760.6,181.9 → 454.6,786.9). Scale 0.1909,
          rotate +18.3°, translate 242.5/−76.2. */}
      <div
        data-svg-id="hull"
        data-svg-name="Hull + pillars"
        data-svg-src="/maps/assets/hall-pillars.svg"
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: 2954,
          height: 4301,
          transform: 'translate(242.5px, -76.2px) rotate(18.3deg) scale(0.1909)',
          transformOrigin: '0 0',
        }}
      >
        <img
          alt=""
          src="/maps/assets/hall-pillars.svg"
          className="block size-full max-w-none opacity-95"
          draggable={false}
        />
      </div>

      {/* Static Figma fixtures — toilet, mushola, panggung platform,
          horseshoe island, seat grid, entrance arrows. Editable in GEOM. */}
      {PLAN_SPRITES.map((sprite) => (
        <div
          key={sprite.id}
          data-svg-id={sprite.id}
          data-svg-name={sprite.label}
          data-svg-src={sprite.src}
          className={`pointer-events-none absolute ${
            sprite.id.includes('arrow') ? 'plan-sprite-arrow' : ''
          }`}
          style={{
            left: sprite.left,
            top: sprite.top,
            width: sprite.w,
            height: sprite.h,
            transform: `rotate(${sprite.rotate}deg)`,
            transformOrigin: 'center',
          }}
        >
          <img
            alt=""
            src={sprite.src}
            className="block size-full max-w-none"
            draggable={false}
          />
        </div>
      ))}

      {/* White wayfinding ticks */}
      <div className="absolute flex h-[20.829px] items-center justify-center top-[181.58px] left-[345.35px] w-[26.687px]">
        <div className="flex-none rotate-[54.94deg]">
          <div className="relative h-[29.06px] w-[5.05px] bg-[#f6f6f6]" />
        </div>
      </div>
      <div className="absolute flex h-[29.685px] items-center justify-center top-[385.26px] left-[212.55px] w-[14.774px]">
        <div className="flex-none rotate-[18.29deg]">
          <div className="relative h-[29.326px] w-[5.865px] bg-[#f6f6f6]" />
        </div>
      </div>

      {/* ENTRANCE banner */}
      <div className="absolute flex h-[90.191px] items-center justify-center top-[339.7px] left-[31.7px] w-[47.943px]">
        <div className="flex-none rotate-[-71.71deg]">
          <div
            className="facility-marker pointer-events-auto relative flex h-[21.433px] w-[87.907px] cursor-pointer items-center justify-center bg-[#0fae4a] px-[6.37px] pt-[6.552px] pb-[6.37px] transition-[filter] hover:brightness-110"
            style={{ fontFamily: 'Priego, sans-serif', fontWeight: 700 } as React.CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={facilities.entrance.title}
            onClick={() => useMapStore.getState().selectFacility('entrance')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                useMapStore.getState().selectFacility('entrance');
              }
            }}
          >
            <span className="text-[15.531px] leading-none tracking-[-0.4659px] whitespace-nowrap text-center text-white">
              {facilities.entrance.title.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* REGISTRATION banner */}
      <div className="absolute flex h-[116.265px] items-center justify-center top-[501.7px] left-[42.1px] w-[56.562px]">
        <div className="flex-none rotate-[-70.71deg]">
          <div
            className="facility-marker pointer-events-auto relative flex h-[21.433px] w-[115.368px] cursor-pointer items-center justify-center bg-[#e5484d] px-[6.37px] pt-[6.552px] pb-[6.37px] transition-[filter] hover:brightness-110"
            style={{ fontFamily: 'Priego, sans-serif', fontWeight: 700 } as React.CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={facilities.registration.title}
            onClick={() => useMapStore.getState().selectFacility('registration')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                useMapStore.getState().selectFacility('registration');
              }
            }}
          >
            <span className="text-[15.531px] leading-none tracking-[-0.4659px] whitespace-nowrap text-center text-white">
              {facilities.registration.title.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* PHOTOBOOTH banner (was Interactive) */}
      <div className="absolute flex h-[80.516px] items-center justify-center top-[163.8px] left-[175.1px] w-[102.342px]">
        <div className="flex-none rotate-[-34.4deg]">
          <div
            className="facility-marker pointer-events-auto relative flex h-[23.819px] w-[107.725px] cursor-pointer items-center justify-center bg-[var(--accent-pink)] px-[6.37px] pt-[6.552px] pb-[6.37px] transition-[filter] hover:brightness-110"
            style={{ fontFamily: 'Priego, sans-serif', fontWeight: 700 } as React.CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={facilities.photobooth.title}
            onClick={() => useMapStore.getState().selectFacility('photobooth')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                useMapStore.getState().selectFacility('photobooth');
              }
            }}
          >
            <span className="text-[15.531px] leading-none tracking-[-1.2425px] whitespace-nowrap text-white">
              {facilities.photobooth.title.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* PHOTO WALL banner */}
      <div className="absolute flex h-[102.326px] items-center justify-center top-[16.9px] left-[260.8px] w-[80.545px]">
        <div className="flex-none rotate-[55.58deg]">
          <div
            className="facility-marker pointer-events-auto relative flex h-[23.819px] w-[107.725px] cursor-pointer items-center justify-center bg-[#0e7490] px-[6.37px] pt-[6.552px] pb-[6.37px] transition-[filter] hover:brightness-110"
            style={{ fontFamily: 'Priego, sans-serif', fontWeight: 700 } as React.CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={facilities['photo-wall'].title}
            onClick={() => useMapStore.getState().selectFacility('photo-wall')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                useMapStore.getState().selectFacility('photo-wall');
              }
            }}
          >
            <span className="text-[15.531px] leading-none tracking-[-1.2425px] whitespace-nowrap text-white">
              {facilities['photo-wall'].title.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* PANGGUNG label */}
      <div className="absolute flex h-[56.567px] -translate-x-1/2 -translate-y-1/2 items-center justify-center top-[243.1px] left-[550.6px] w-[83.646px]">
        <div className="flex-none rotate-[29.24deg]">
          <div
            className="facility-marker pointer-events-auto relative flex h-[16.266px] w-[86.753px] cursor-pointer flex-col items-center justify-center text-center transition-[filter] hover:brightness-105"
            style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, ['--glow' as string]: '#d4d4d8' } as React.CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={facilities.panggung.title}
            onClick={() => useMapStore.getState().selectFacility('panggung')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                useMapStore.getState().selectFacility('panggung');
              }
            }}
          >
            <span className="text-[11.347px] leading-none tracking-[-0.9077px] whitespace-nowrap text-black">
              {facilities.panggung.title.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      </>
    ),
    [],
  );

  return (
    <div
      ref={ref}
      data-floorplan-root=""
      className="pointer-events-none absolute top-0 left-0 select-none"
      style={{
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
        transformOrigin: '0 0',
        willChange: 'transform',
      }}
    >
      {staticPlan}

      {/* Booths — pure visuals; hover/click is resolved by MapLibreMap via
          inverse homography + hit-testing so panning is never swallowed. */}
      {BOOTH_SHAPES.map((shape) => {
        const active = activeBoothId === shape.id;
        return (
          <div
            key={shape.id}
            data-booth={shape.id}
            className="absolute flex items-center justify-center"
            style={{ left: shape.left, top: shape.top, width: shape.w, height: shape.h, zIndex: active ? 10 : 5 }}
          >
            <div
              className="relative flex-none"
              style={{ transform: `rotate(${shape.rotate}deg)`, transition: 'filter 150ms ease' }}
            >
              {active && (
                <>
                  <span
                    className="venue-ring"
                    style={{ borderColor: shape.bg, backgroundColor: `${shape.bg}22` }}
                    aria-hidden="true"
                  />
                  <span
                    className="venue-ring"
                    style={{
                      borderColor: shape.bg,
                      backgroundColor: `${shape.bg}22`,
                      animationDelay: '0.6s',
                    }}
                    aria-hidden="true"
                  />
                </>
              )}
              <div
                className="relative flex flex-col items-center justify-center"
                style={{
                  width: shape.innerW,
                  height: shape.innerH,
                  background: shape.bg,
                  border: shape.borderColor
                    ? `${shape.borderWidth}px solid ${shape.borderColor}`
                    : '1px solid rgba(9, 9, 11, 0.45)',
                  padding: shape.padding,
                  filter: active ? 'brightness(1.04)' : undefined,
                }}
              >
                <span
                  className="font-bold leading-none whitespace-nowrap"
                  style={{
                    fontSize: shape.labelSize,
                    letterSpacing: `${shape.labelTracking}px`,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    color:
                      shape.id.startsWith('d') || shape.id.startsWith('e')
                        ? '#1a1a1a'
                        : '#fff',
                    transform: shape.labelRotate ? `rotate(${shape.labelRotate}deg)` : undefined,
                  }}
                >
                  {shape.code}
                </span>
                {shape.id === 'a' && (
                  <span
                    className="mt-0.5 leading-none text-white"
                    style={{ fontFamily: 'Priego, sans-serif', fontSize: 7, fontWeight: 700 }}
                  >
                    CAREER STAR
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {selectedFacilityId &&
        (() => {
          const facility = FACILITY_FRAME_POINTS[selectedFacilityId];
          if (!facility) return null;
          return (
            <div
              className="pointer-events-none absolute"
              style={{
                left: facility.point[0] - 24,
                top: facility.point[1] - 24,
                width: 48,
                height: 48,
                zIndex: 12,
              }}
            >
              <span
                className="venue-ring"
                style={{
                  borderColor: facility.color,
                  backgroundColor: `${facility.color}22`,
                }}
                aria-hidden="true"
              />
              <span
                className="venue-ring"
                style={{
                  borderColor: facility.color,
                  backgroundColor: `${facility.color}22`,
                  animationDelay: '0.6s',
                }}
                aria-hidden="true"
              />
              <span
                className="facility-guide-arrow"
                style={{ color: facility.color }}
                aria-hidden="true"
              >
                ↓
              </span>
            </div>
          );
        })()}
    </div>
  );
});

export default FloorPlanOverlay;
