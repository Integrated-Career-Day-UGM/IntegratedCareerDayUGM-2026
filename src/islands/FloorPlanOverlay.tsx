import { forwardRef } from 'react';
import { useMapStore } from '../stores/mapStore';
import { getBooth, getCompanyForBooth, getZone } from '../lib/data';
import {
  BOOTH_SHAPES,
  FRAME_HEIGHT,
  FRAME_WIDTH,
  SEAT_DOTS,
  type BoothShape,
} from '../lib/floorplan';

/**
 * Hall C1 floor-plan, implemented from the Figma frame "Frame 1686561279"
 * (node 1729:23400, 818 x 820). The root element is warped onto the map by
 * MapLibreMap via a per-frame CSS matrix3d, so every child simply uses frame
 * pixel coordinates. Booth boxes are interactive and wired to the store.
 */
const FloorPlanOverlay = forwardRef<HTMLDivElement>(function FloorPlanOverlay(_, ref) {
  const { hoveredBoothId, selectedBoothId } = useMapStore();
  const activeBoothId = hoveredBoothId ?? selectedBoothId;

  const boothMeta = (shape: BoothShape) => {
    const booth = getBooth(shape.id);
    const zone = getZone(booth?.zoneId ?? '');
    const company = getCompanyForBooth(shape.id);
    return {
      zoneColor: zone?.color ?? '#ff316b',
      zoneName: zone?.name ?? '',
      companyName: company?.name ?? booth?.label ?? shape.code,
    };
  };

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
      {/* Hall outline (opaque light slab over the basemap) */}
      <div className="absolute flex h-[789.359px] items-center justify-center top-[0.21px] left-[92.52px] w-[667.786px]">
        <div className="flex-none rotate-[-63.71deg]">
          <div className="relative h-[409.89px] w-[677.931px] [filter:drop-shadow(0_18px_28px_rgba(0,0,0,0.55))]">
            <div className="absolute inset-[0.27%_0.25%_0_0.12%]">
              <img
                alt=""
                src="/maps/assets/hall-outline.svg"
                className="block size-full max-w-none opacity-70"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Registration desk slab */}
      <div className="absolute flex h-[82.436px] items-center justify-center top-[218.38px] left-[540.63px] w-[101.39px]">
        <div className="flex-none rotate-[-59.38deg]">
          <div className="relative h-[94.08px] w-[40.106px] border-[0.637px] border-solid border-[#7b7b7b] bg-[#c0c0c0]" />
        </div>
      </div>

      {/* Seat-marker grid (80 rotated squares) */}
      {SEAT_DOTS.map(([x, y], i) => (
        <div
          key={i}
          className="absolute flex h-[10.23px] w-[10.039px] items-center justify-center"
          style={{ left: x, top: y }}
        >
          <div className="flex-none rotate-[-58.37deg]">
            <div className="relative h-[7.074px] w-[7.658px] rounded-[1.274px] border-[0.637px] border-solid border-black" />
          </div>
        </div>
      ))}

      {/* Stage-side booth cluster outline */}
      <div className="absolute flex h-[104.008px] items-center justify-center top-[152.93px] left-[566.07px] w-[141.438px]">
        <div className="flex-none rotate-[-69.09deg]">
          <div className="relative h-[127.477px] w-[62.643px]">
            <img
              alt=""
              src="/maps/assets/booth-reg.svg"
              className="absolute inset-0 block size-full max-w-none"
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Entrance arrow */}
      <div className="absolute flex h-[154.453px] items-center justify-center top-[115.13px] left-[430.18px] w-[160.87px]">
        <div className="flex-none rotate-[-71.71deg]">
          <div className="relative h-[129.844px] w-[119.749px]">
            <div className="absolute inset-[-0.31%_-0.46%_2.99%_1.62%]">
              <img
                alt=""
                src="/maps/assets/arrow-entrance.svg"
                className="block size-full max-w-none"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location pins */}
      <div className="absolute flex h-[31.142px] items-center justify-center top-[386.53px] left-[216.31px] w-[22.071px]">
        <div className="flex-none rotate-[-71.71deg]">
          <div className="relative h-[13.924px] w-[28.197px]">
            <div className="absolute inset-[-2.29%_-1.13%]">
              <img alt="" src="/maps/assets/pin-a.svg" className="block size-full max-w-none" draggable={false} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[27.744px] items-center justify-center top-[184.54px] left-[347.49px] w-[31.03px]">
        <div className="flex-none rotate-[-35.63deg]">
          <div className="relative h-[13.924px] w-[28.197px]">
            <div className="absolute inset-[-2.29%_-1.13%]">
              <img alt="" src="/maps/assets/pin-b.svg" className="block size-full max-w-none" draggable={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Stage speaker dots */}
      <div className="absolute flex h-[57.498px] items-center justify-center top-[152.06px] left-[443.22px] w-[61.49px]">
        <div className="flex-none rotate-[-41.05deg]">
          <div className="relative h-[21.677px] w-[62.66px]">
            <div className="absolute inset-[-1.47%_-0.51%]">
              <img alt="" src="/maps/assets/dots-a.svg" className="block size-full max-w-none" draggable={false} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[32.807px] items-center justify-center top-[179.63px] left-[496.02px] w-[33.137px]">
        <div className="flex-none rotate-[-41.05deg]">
          <div className="relative h-[21.675px] w-[25.065px]">
            <div className="absolute inset-[-1.47%_-1.27%]">
              <img alt="" src="/maps/assets/dots-b.svg" className="block size-full max-w-none" draggable={false} />
            </div>
          </div>
        </div>
      </div>

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

      {/* Small arrows near information center */}
      <div className="absolute flex h-[19.412px] items-center justify-center top-[383.71px] left-[187.71px] w-[23.755px]">
        <div className="flex-none rotate-[18.29deg]">
          <div className="relative h-[13.667px] w-[20.501px]">
            <div className="absolute inset-[5.19%_0.68%_5.19%_0]">
              <img alt="" src="/maps/assets/arrow-info.svg" className="block size-full max-w-none" draggable={false} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[24.618px] items-center justify-center top-[164.16px] left-[336.39px] w-[23.119px]">
        <div className="flex-none rotate-[-126.07deg]">
          <div className="relative h-[13.667px] w-[20.501px]">
            <div className="absolute inset-[5.19%_0.68%_5.19%_0]">
              <img alt="" src="/maps/assets/arrow-info-2.svg" className="block size-full max-w-none" draggable={false} />
            </div>
          </div>
        </div>
      </div>

      {/* ENTRANCE banner */}
      <div className="absolute flex h-[90.191px] items-center justify-center top-[337.52px] left-[143.56px] w-[47.943px]">
        <div className="flex-none rotate-[-71.71deg]">
          <div
            className="relative flex h-[21.433px] w-[87.907px] items-center justify-center bg-[#00ff1e] px-[6.37px] pt-[6.552px] pb-[6.37px]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <span className="text-[15.531px] leading-none tracking-[-0.4659px] whitespace-nowrap text-center text-black">
              ENTRANCE
            </span>
          </div>
        </div>
      </div>

      {/* REGISTRATION banner */}
      <div className="absolute flex h-[116.265px] items-center justify-center top-[460.38px] left-[131.31px] w-[56.562px]">
        <div className="flex-none rotate-[-71.71deg]">
          <div
            className="relative flex h-[21.433px] w-[115.368px] items-center justify-center bg-red-600 px-[6.37px] pt-[6.552px] pb-[6.37px]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <span className="text-[15.531px] leading-none tracking-[-0.4659px] whitespace-nowrap text-center text-black">
              REGISTRATION
            </span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE banner */}
      <div className="absolute flex h-[80.516px] items-center justify-center top-[185.02px] left-[223.86px] w-[102.342px]">
        <div className="flex-none rotate-[-34.4deg]">
          <div
            className="relative flex h-[23.819px] w-[107.725px] items-center justify-center bg-[#98fff5] px-[6.37px] pt-[6.552px] pb-[6.37px]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <span className="text-[15.531px] leading-none tracking-[-1.2425px] whitespace-nowrap text-black">
              INTERACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* PHOTO WALL banner */}
      <div className="absolute flex h-[102.326px] items-center justify-center top-[77.97px] left-[186.71px] w-[80.545px]">
        <div className="flex-none rotate-[55.58deg]">
          <div
            className="relative flex h-[23.819px] w-[107.725px] items-center justify-center bg-[#ff316b] px-[6.37px] pt-[6.552px] pb-[6.37px]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <span className="text-[15.531px] leading-none tracking-[-1.2425px] whitespace-nowrap text-black">
              PHOTO WALL
            </span>
          </div>
        </div>
      </div>

      {/* PANGGUNG label */}
      <div className="absolute flex h-[56.567px] -translate-x-1/2 -translate-y-1/2 items-center justify-center top-[260.27px] left-[591.27px] w-[83.646px]">
        <div className="flex-none rotate-[29.24deg]">
          <div
            className="relative flex h-[16.266px] w-[86.753px] flex-col items-center justify-center text-center"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}
          >
            <span className="text-[11.347px] leading-none tracking-[-0.9077px] whitespace-nowrap text-black">
              PANGGUNG
            </span>
          </div>
        </div>
      </div>

      {/* Information Center */}
      <div className="absolute flex h-[84.614px] items-center justify-center top-[280.96px] left-[239.65px] w-[56.632px]">
        <div className="flex-none rotate-[-71.71deg]">
          <div className="relative flex h-[33.888px] w-[77.915px] flex-col items-center justify-center border-[1.094px] border-solid border-white bg-[#f0c71d] p-[5.472px]">
            <span className="text-[12.007px] leading-none tracking-[-0.2401px] font-bold whitespace-nowrap text-center text-white">
              Information
            </span>
            <span className="text-[12.007px] leading-none tracking-[-0.2401px] font-bold whitespace-nowrap text-center text-white">
              Center
            </span>
          </div>
        </div>
      </div>

      {/* Booths — pure visuals; hover/click is resolved by MapLibreMap via
          inverse homography + hit-testing so panning is never swallowed. */}
      {BOOTH_SHAPES.map((shape) => {
        const active = activeBoothId === shape.id;
        const { zoneColor, companyName } = boothMeta(shape);
        return (
          <div
            key={shape.id}
            data-booth={shape.id}
            className="absolute flex items-center justify-center"
            style={{ left: shape.left, top: shape.top, width: shape.w, height: shape.h, zIndex: active ? 10 : 5 }}
          >
            <div
              className="flex-none"
              style={{ transform: `rotate(${shape.rotate}deg)`, transition: 'filter 150ms ease' }}
            >
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: shape.innerW,
                  height: shape.innerH,
                  background: shape.bg,
                  border: `${shape.borderWidth}px solid #ffffff`,
                  padding: shape.padding,
                  ...(active
                    ? {
                        animation: 'booth-pulse 1.6s ease-in-out infinite',
                        ['--glow' as string]: zoneColor,
                      }
                    : { boxShadow: undefined }),
                  filter: active ? 'brightness(1.12)' : undefined,
                }}
              >
                <span
                  className="font-bold leading-none whitespace-nowrap text-white"
                  style={{
                    fontSize: shape.labelSize,
                    letterSpacing: `${shape.labelTracking}px`,
                    transform: shape.labelRotate ? `rotate(${shape.labelRotate}deg)` : undefined,
                  }}
                >
                  {shape.code}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default FloorPlanOverlay;
