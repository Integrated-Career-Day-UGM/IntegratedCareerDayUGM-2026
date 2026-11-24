'use client';

interface PillarBarProps {
  fromPercent: string;
  toPercent: string;
  delay: number;
}

function PillarBar({ fromPercent, toPercent, delay }: PillarBarProps) {
  return (
    <div
      className="flex-shrink-0"
      style={{
        width: '10%',
        height: '100%',
        background: `linear-gradient(to top, var(--icd-teal-dark) ${fromPercent}, var(--icd-teal) ${toPercent})`,
        boxShadow: '1.34px 0px 6.698px 0px rgba(0,0,0,0.25)',
        transformOrigin: 'bottom',
        animation: `companiesBarPulse 5s ease-in-out infinite alternate`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

interface CompaniesBackgroundProps {
  variant: 'desktop' | 'mobile';
}

export default function CompaniesBackground({ variant }: CompaniesBackgroundProps) {
  const isDesktop = variant === 'desktop';

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes companiesBarPulse {
          0% { transform: scaleY(1); opacity: 0.92; }
          100% { transform: scaleY(0.96); opacity: 1; }
        }
      `}</style>

      {isDesktop ? (
        <>
          {/* Light base background */}
          <div className="absolute inset-0 bg-[#f4faff]" />

          {/* Side pillar strips */}
          <div className="absolute left-0 top-0 h-full w-[145px] overflow-hidden">
            <div className="flex h-full w-[1450px]">
              {[...Array(10)].map((_, i) => (
                <PillarBar
                  key={i}
                  fromPercent={[
                    '37.474%',
                    '41.346%',
                    '48.077%',
                    '38.462%',
                    '26.923%',
                    '38.462%',
                    '27.404%',
                    '48.077%',
                    '26.923%',
                    '27.404%',
                  ][i]}
                  toPercent={[
                    '69.559%',
                    '75.962%',
                    '72.115%',
                    '76.923%',
                    '75.481%',
                    '76.923%',
                    '59.615%',
                    '72.115%',
                    '75.481%',
                    '59.615%',
                  ][i]}
                  delay={i * 0.15}
                />
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-[145px] overflow-hidden">
            <div className="flex h-full w-[1450px]">
              {[...Array(10)].map((_, i) => (
                <PillarBar
                  key={i}
                  fromPercent={[
                    '27.404%',
                    '26.923%',
                    '48.077%',
                    '27.404%',
                    '38.462%',
                    '26.923%',
                    '38.462%',
                    '48.077%',
                    '41.346%',
                    '37.474%',
                  ][i]}
                  toPercent={[
                    '59.615%',
                    '75.481%',
                    '72.115%',
                    '59.615%',
                    '76.923%',
                    '75.481%',
                    '76.923%',
                    '72.115%',
                    '75.962%',
                    '69.559%',
                  ][i]}
                  delay={i * 0.15 + 0.5}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, #249ea1 4.977%, #1d737c 29.327%, #164d5c 58.173%)',
          }}
        />
      )}
    </div>
  );
}
