'use client';

interface IntroBackgroundProps {
  variant: 'desktop' | 'mobile';
}

export default function IntroBackground({ variant }: IntroBackgroundProps) {
  const isDesktop = variant === 'desktop';

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Base light blue */}
      <div className="absolute inset-0 bg-[#f4faff]" />

      {/* Diagonal hatched pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 6px,
            rgba(36, 158, 161, 0.15) 6px,
            rgba(36, 158, 161, 0.15) 8px
          )`,
        }}
      />

      {/* Teal pixelated side decorations */}
      {isDesktop ? (
        <>
          <div className="absolute left-[-47.83px] top-[102.03px] z-0">
            <div className="flex h-[514.09px] w-[576.631px] rotate-180 items-center justify-center">
              <div
                className="h-[514.09px] w-[576.631px] bg-gradient-to-b from-[var(--icd-teal-dark)] from-[21.154%] to-[var(--icd-teal)] to-[69.559%]"
                style={{
                  maskImage: "url('/landing/intro/rectangle40833.svg')",
                  WebkitMaskImage: "url('/landing/intro/rectangle40833.svg')",
                  maskSize: '281.817px 356.403px',
                  WebkitMaskSize: '281.817px 356.403px',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: '124.427px 108.723px',
                }}
              />
            </div>
          </div>
          <div className="absolute left-[1165.56px] top-[142.56px] z-0">
            <div
              className="h-[514.09px] w-[576.631px] bg-gradient-to-b from-[var(--icd-teal-dark)] from-[21.154%] to-[var(--icd-teal)] to-[69.559%]"
              style={{
                maskImage: "url('/landing/intro/rectangle40833.svg')",
                WebkitMaskImage: "url('/landing/intro/rectangle40833.svg')",
                maskSize: '281.817px 356.403px',
                WebkitMaskSize: '281.817px 356.403px',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: '170.387px 48.963px',
              }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="absolute left-[-173px] top-[-97.37px] z-0 opacity-60">
            <div
              className="h-[362.052px] w-[406.097px] bg-gradient-to-b from-[#164d5c] from-[21.154%] to-[#249ea1] to-[69.559%]"
              style={{
                maskImage: "url('/landing/intro/rectangle40833.svg')",
                WebkitMaskImage: "url('/landing/intro/rectangle40833.svg')",
                maskSize: '198.472px 251px',
                WebkitMaskSize: '198.472px 251px',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: '119.997px 34.483px',
              }}
            />
          </div>
          <div className="absolute right-[-120px] top-[80px] z-0 scale-x-[-1] opacity-60">
            <div
              className="h-[362.052px] w-[406.097px] bg-gradient-to-b from-[#164d5c] from-[21.154%] to-[#249ea1] to-[69.559%]"
              style={{
                maskImage: "url('/landing/intro/rectangle40833.svg')",
                WebkitMaskImage: "url('/landing/intro/rectangle40833.svg')",
                maskSize: '198.472px 251px',
                WebkitMaskSize: '198.472px 251px',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: '119.997px 34.483px',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
