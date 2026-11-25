'use client';

interface PillarBar {
  from: string;
  to: string;
  shadow?: boolean;
}

const FRONT_BARS: PillarBar[] = [
  { from: '#ffb42b', to: '#ff316b' },
  { from: '#ff316b', to: '#ffb42b', shadow: true },
  { from: '#ff316b', to: '#ffb42b', shadow: true },
  { from: 'transparent', to: 'transparent' },
  { from: '#ff316b', to: '#ffb42b', shadow: true },
  { from: '#ff316b', to: '#ffb42b', shadow: true },
  { from: 'transparent', to: 'transparent' },
  { from: '#ff316b', to: '#ffb42b', shadow: true },
  { from: '#ff316b', to: '#ffb42b' },
];

const BACK_BARS: PillarBar[] = [
  { from: '#ff316b', to: '#ffb42b' },
  { from: '#ff316b', to: '#ffb42b', shadow: true },
  { from: '#ff316b', to: '#ffb42b', shadow: true },
  { from: 'transparent', to: 'transparent' },
  { from: '#ff316b', to: '#ffb42b', shadow: true },
  { from: '#ff316b', to: '#ffb42b', shadow: true },
  { from: 'transparent', to: 'transparent' },
  { from: '#ff316b', to: '#ffb42b', shadow: true },
  { from: '#ff316b', to: '#ffb42b' },
];

interface MapPreviewBackgroundProps {
  variant: 'desktop' | 'mobile';
}

function Pillars({ bars, width, height, shadow }: { bars: PillarBar[]; width: number; height: number; shadow: string }) {
  return (
    <div className="flex" style={{ width: width * bars.length, height }}>
      {bars.map((bar, index) => (
        <div
          key={index}
          className="shrink-0"
          style={{
            width,
            height,
            background:
              bar.from === 'transparent'
                ? 'transparent'
                : `linear-gradient(to bottom, ${bar.from} 26.436%, ${bar.to} 76.204%)`,
            boxShadow: bar.shadow ? shadow : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default function MapPreviewBackground({ variant }: MapPreviewBackgroundProps) {
  const isDesktop = variant === 'desktop';
  const pillWidth = isDesktop ? 154.222 : 123.333;
  const pillHeight = isDesktop ? 963.889 : 770.833;
  const shadow = isDesktop
    ? '1.428px 0px 7.14px 0px rgba(0,0,0,0.25)'
    : '1.142px 0px 5.71px 0px rgba(0,0,0,0.25)';

  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden ${isDesktop ? 'rounded-[24px]' : 'rounded-[16px]'}`}
      aria-hidden="true"
    >
      {/* Base orange → pink gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(118deg, #ff9a3c 0%, #ff7d3f 24%, #ff5d4e 54%, #ff3f62 78%, #ff316b 100%)',
        }}
      />

      {/* Back layer */}
      <div
        className={`absolute flex justify-center ${isDesktop ? 'left-0 top-[-482px]' : 'left-1/2 top-[-25%] -translate-x-1/2'}`}
        style={{ transform: isDesktop ? 'scaleY(-1)' : 'translateX(-50%) scaleY(-1)' }}
      >
        <Pillars bars={BACK_BARS} width={pillWidth} height={pillHeight} shadow={shadow} />
      </div>

      {/* Front layer */}
      <div
        className={`absolute flex justify-center ${isDesktop ? 'left-0 top-[482px]' : 'left-1/2 top-[50.83%] -translate-x-1/2'}`}
      >
        <Pillars bars={FRONT_BARS} width={pillWidth} height={pillHeight} shadow={shadow} />
      </div>

      {/* Soft bottom fade so the lower card stays orange */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38%]"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,120,50,0.55))' }}
      />
    </div>
  );
}
