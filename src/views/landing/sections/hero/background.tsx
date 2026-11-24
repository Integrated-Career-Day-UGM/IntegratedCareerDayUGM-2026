'use client';

import { ParallaxProvider, Parallax } from 'react-scroll-parallax';

interface GradientBarsProps {
  count?: number;
  gradientFrom?: string;
  gradientTo?: string;
  animationDuration?: number;
}

function GradientBars({
  count = 10,
  gradientFrom = '#164d5c',
  gradientTo = '#249ea1',
  animationDuration = 5,
}: GradientBarsProps) {
  const variants = [
    { from: '37.474%', to: '69.559%' },
    { from: '41.346%', to: '75.962%' },
    { from: '48.077%', to: '72.115%' },
    { from: '42.991%', to: '73.462%' },
  ];

  return (
    <>
      <style>{`
        @keyframes heroBarPulse {
          0% { transform: scaleY(1); opacity: 0.92; }
          100% { transform: scaleY(0.96); opacity: 1; }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-10px) rotate(var(--r, 0deg)); }
        }
      `}</style>
      <div className="absolute inset-0 flex h-full w-full overflow-hidden">
        {Array.from({ length: count }).map((_, index) => {
          const variant = variants[index % variants.length];
          return (
            <div
              key={index}
              className="flex-shrink-0"
              style={{
                width: `${100 / count}%`,
                height: '100%',
                background: `linear-gradient(to top, ${gradientFrom} ${variant.from}, ${gradientTo} ${variant.to})`,
                boxShadow: '1.34px 0px 6.698px 0px rgba(0,0,0,0.25)',
                transformOrigin: 'bottom',
                animation: `heroBarPulse ${animationDuration}s ease-in-out infinite alternate`,
                animationDelay: `${index * 0.15}s`,
              }}
            />
          );
        })}
      </div>
    </>
  );
}

interface HeroBackgroundProps {
  variant: 'desktop' | 'mobile';
}

export default function HeroBackground({ variant }: HeroBackgroundProps) {
  const isDesktop = variant === 'desktop';

  return (
    <ParallaxProvider>
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Background bars — fill the frame exactly, no negative offsets */}
        <GradientBars count={10} gradientFrom="#164d5c" gradientTo="#249ea1" />

        {/* Floating decals — exact Figma positions, explicit sizes, gentle float */}
        {isDesktop ? (
          <>
            <Parallax speed={-8}>
              <div
                className="absolute flex items-center justify-center"
                style={{
                  left: '-2.64%',
                  right: '93.43%',
                  top: '7.48%',
                  bottom: '77.52%',
                  animation: 'heroFloat 6s ease-in-out infinite',
                  '--r': '21.05deg',
                } as React.CSSProperties}
              >
                <img alt="" className="block h-full w-full max-w-none object-contain" src="/landing/hero/group1171276816.svg" />
              </div>
            </Parallax>

            <Parallax speed={-12}>
              <div
                className="absolute flex items-center justify-center"
                style={{
                  left: '88.4%',
                  right: '7.55%',
                  top: '1.57%',
                  bottom: '91.22%',
                  animation: 'heroFloat 7s ease-in-out infinite',
                  animationDelay: '0.5s',
                  '--r': '-24.43deg',
                } as React.CSSProperties}
              >
                <img alt="" className="block h-full w-full max-w-none object-contain" src="/landing/hero/group1171276825.svg" />
              </div>
            </Parallax>

            <Parallax speed={-6}>
              <div
                className="absolute flex items-center justify-center"
                style={{
                  left: '1264px',
                  top: '33px',
                  width: '105.061px',
                  height: '134.475px',
                  animation: 'heroFloat 5s ease-in-out infinite',
                  animationDelay: '1s',
                  '--r': '-12.34deg',
                } as React.CSSProperties}
              >
                <img alt="" className="block h-full w-full max-w-none object-contain" src="/landing/hero/group1171276819.svg" />
              </div>
            </Parallax>

            <Parallax speed={-10}>
              <div
                className="absolute"
                style={{
                  left: '1090px',
                  top: '391px',
                  width: '190.147px',
                  height: '189.386px',
                  animation: 'heroFloat 8s ease-in-out infinite',
                  animationDelay: '1.2s',
                }}
              >
                <img alt="" className="absolute left-[5.57px] top-[48.42px] w-[132px]" style={{ transform: 'rotate(24.96deg)' }} src="/landing/hero/rectangle40870.svg" />
                <img alt="" className="absolute left-[12.71px] top-0 w-[143.614px]" style={{ transform: 'rotate(24.96deg)' }} src="/landing/hero/union-stroke.svg" />
                <img alt="" className="absolute left-[5.57px] top-[48.42px] w-[131.4px]" style={{ transform: 'rotate(24.96deg)' }} src="/landing/hero/union1.svg" />
                <img alt="" className="absolute left-[20.68px] top-[7.97px] w-[131.614px]" style={{ transform: 'rotate(24.96deg)' }} src="/landing/hero/union2.svg" />
                <img alt="" className="absolute left-[47.82px] top-[113.64px] w-[54.3px]" style={{ transform: 'rotate(24.96deg)' }} src="/landing/hero/group1171276822.svg" />
                <img alt="" className="absolute left-[26.66px] top-[13.95px] w-[122.614px]" style={{ transform: 'rotate(24.96deg)' }} src="/landing/hero/mask-group.svg" />
              </div>
            </Parallax>

            <Parallax speed={-8}>
              <div
                className="absolute flex items-center justify-center"
                style={{
                  left: '-2.85%',
                  right: '91.72%',
                  top: 'calc(50% - 286.09px)',
                  height: '175.826px',
                  transform: 'translateY(-50%)',
                  animation: 'heroFloat 6.5s ease-in-out infinite',
                  animationDelay: '0.3s',
                  '--r': '-23.42deg',
                } as React.CSSProperties}
              >
                <img alt="" className="block h-full w-full max-w-none object-contain" src="/landing/hero/vector1.svg" />
                <img alt="" className="absolute inset-[13%_5%_14%_5%] block max-w-none object-contain" src="/landing/hero/union3.svg" />
              </div>
            </Parallax>

            <Parallax speed={-4}>
              <div
                className="absolute flex items-center justify-center"
                style={{
                  left: '9.24%',
                  right: '73.37%',
                  top: '35.62%',
                  bottom: '32.29%',
                  animation: 'heroFloat 5.5s ease-in-out infinite',
                  animationDelay: '0.8s',
                  '--r': '-0.94deg',
                } as React.CSSProperties}
              >
                <img alt="" className="block h-full w-full max-w-none object-contain" src="/landing/hero/group1171277037.svg" />
              </div>
            </Parallax>

            <Parallax speed={-6}>
              <div
                className="absolute flex items-center justify-center"
                style={{
                  left: '213.5px',
                  top: '540.5px',
                  width: '106.5px',
                  height: '79px',
                  animation: 'heroFloat 6s ease-in-out infinite',
                  animationDelay: '1.5s',
                }}
              >
                <img alt="" className="block h-full w-full max-w-none object-contain" src="/landing/hero/rectangle41503.svg" />
              </div>
            </Parallax>
          </>
        ) : (
          <>
            <Parallax speed={-6}>
              <div className="absolute left-[-40px] top-[80px] w-[80px] animate-[heroFloat_6s_ease-in-out_infinite]" style={{ '--r': '21.05deg' } as React.CSSProperties}>
                <img alt="" src="/landing/hero/group1171276816.svg" className="w-full" />
              </div>
            </Parallax>
            <Parallax speed={-8}>
              <div className="absolute right-[-30px] top-[120px] w-[70px] animate-[heroFloat_7s_ease-in-out_infinite]" style={{ '--r': '-24.43deg', animationDelay: '0.5s' } as React.CSSProperties}>
                <img alt="" src="/landing/hero/group1171276825.svg" className="w-full" />
              </div>
            </Parallax>
            <Parallax speed={-4}>
              <div className="absolute left-[-20px] top-[380px] w-[140px] animate-[heroFloat_5.5s_ease-in-out_infinite]" style={{ '--r': '-0.94deg', animationDelay: '0.8s' } as React.CSSProperties}>
                <img alt="" src="/landing/hero/group1171277037.svg" className="w-full" />
              </div>
            </Parallax>
            <Parallax speed={-6}>
              <div className="absolute right-[-10px] top-[420px] w-[60px] animate-[heroFloat_6s_ease-in-out_infinite]" style={{ animationDelay: '1s' } as React.CSSProperties}>
                <img alt="" src="/landing/hero/rectangle41503.svg" className="w-full" />
              </div>
            </Parallax>
            <Parallax speed={-10}>
              <div className="absolute right-[-20px] top-[560px] w-[70px] animate-[heroFloat_5s_ease-in-out_infinite]" style={{ '--r': '-12.34deg', animationDelay: '1.2s' } as React.CSSProperties}>
                <img alt="" src="/landing/hero/group1171276819.svg" className="w-full" />
              </div>
            </Parallax>
          </>
        )}
      </div>
    </ParallaxProvider>
  );
}
