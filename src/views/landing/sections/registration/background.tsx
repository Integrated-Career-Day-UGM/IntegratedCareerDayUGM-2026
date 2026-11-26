'use client';

interface RegistrationBackgroundProps {
  variant: 'desktop' | 'mobile';
}

function FolderDecal({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="rotate-[-26.25deg]">
        <img
          alt=""
          src="/landing/registration/group1171276906.svg"
          className="block w-[138px] max-w-none"
        />
      </div>
    </div>
  );
}

function PageDecal({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="rotate-[-167.59deg] scale-y-[-1]">
        <img
          alt=""
          src="/landing/registration/group1171276907.svg"
          className="block w-[86px] max-w-none"
        />
      </div>
    </div>
  );
}

function BulbDecal({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="rotate-[30.4deg]">
        <img
          alt=""
          src="/landing/registration/group1171276826.svg"
          className="block w-[147px] max-w-none"
        />
      </div>
    </div>
  );
}

export default function RegistrationBackground({ variant }: RegistrationBackgroundProps) {
  const isDesktop = variant === 'desktop';

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Base paper */}
      <div className="absolute inset-0 bg-[#f4faff]" />

      {/* Graph-paper grid */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(36,158,161,0.14) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(36,158,161,0.14) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {isDesktop ? (
        <>
          <FolderDecal className="absolute left-[-40px] top-[10px] z-0 w-[200px]" />
          <PageDecal className="absolute left-[-10px] top-[170px] z-0 w-[120px]" />
          <BulbDecal className="absolute right-[40px] top-[-90px] z-0 w-[200px]" />

          {/* Teal pixel blocks — bottom left */}
          <div className="absolute bottom-[-40px] left-[-40px] z-0 h-[220px] w-[220px]">
            <div className="absolute bottom-0 left-0 h-[80px] w-[80px] bg-[var(--icd-teal-dark)]" />
            <div className="absolute bottom-0 left-[96px] h-[48px] w-[48px] bg-[var(--icd-teal-dark)]" />
            <div className="absolute bottom-[88px] left-[8px] h-[36px] w-[36px] bg-[var(--icd-teal)]" />
            <div className="absolute bottom-[44px] left-[120px] h-[64px] w-[64px] bg-[var(--icd-teal)] opacity-70" />
          </div>

          {/* Teal pixel arrow — right edge */}
          <div className="absolute right-[-30px] top-[38%] z-0 h-[120px] w-[160px] opacity-90">
            <div className="absolute left-0 top-0 h-[26px] w-[26px] bg-[var(--icd-teal)]" />
            <div className="absolute left-[34px] top-[22px] h-[26px] w-[26px] bg-[var(--icd-teal)]" />
            <div className="absolute left-[68px] top-[44px] h-[26px] w-[26px] bg-[var(--icd-teal)]" />
            <div className="absolute left-[34px] top-[66px] h-[26px] w-[26px] bg-[var(--icd-teal)]" />
            <div className="absolute left-0 top-[88px] h-[26px] w-[26px] bg-[var(--icd-teal)]" />
          </div>

          {/* Subtle teal corner accents */}
          <div className="absolute right-[80px] bottom-[70px] z-0 h-[96px] w-[64px] bg-[var(--icd-teal)] opacity-60" />
          <div className="absolute right-[152px] bottom-[70px] z-0 h-[48px] w-[48px] bg-[var(--icd-teal)] opacity-40" />
        </>
      ) : (
        <>
          {/* Exact mobile accent exports (node 1487:18218) */}
          <div className="absolute left-[-43px] top-[-1px] z-0 rotate-[-26.25deg]">
            <img
              alt=""
              src="/landing/registration/mobile-accent-folder.svg"
              className="block w-[65.2px] max-w-none"
            />
          </div>
          <div className="absolute right-[-10px] top-[-2px] z-0 rotate-[30.4deg]">
            <img
              alt=""
              src="/landing/registration/mobile-accent-bulb.svg"
              className="block w-[60.9px] max-w-none"
            />
          </div>

          {/* Left pixel cluster */}
          <div className="absolute left-[-10px] top-[212px] z-0 h-[22px] w-[54px] bg-[var(--icd-teal-dark)] opacity-80" />
          <div className="absolute left-[-16px] top-[300px] z-0 opacity-80">
            <div className="absolute left-0 top-0 size-[12px] bg-[var(--icd-teal)]" />
            <div className="absolute left-[16px] top-[10px] size-[12px] bg-[var(--icd-teal)]" />
            <div className="absolute left-[32px] top-[20px] size-[12px] bg-[var(--icd-teal)]" />
            <div className="absolute left-[16px] top-[30px] size-[12px] bg-[var(--icd-teal)]" />
            <div className="absolute left-0 top-[40px] size-[12px] bg-[var(--icd-teal)]" />
          </div>

          {/* Right pixel cluster */}
          <div className="absolute right-[-14px] top-[378px] z-0 h-[22px] w-[48px] bg-[var(--icd-teal-dark)] opacity-70" />
          <div className="absolute right-[-18px] top-[545px] z-0 opacity-80">
            <div className="absolute right-0 top-0 size-[12px] bg-[var(--icd-teal)]" />
            <div className="absolute right-[16px] top-[10px] size-[12px] bg-[var(--icd-teal)]" />
            <div className="absolute right-[32px] top-[20px] size-[12px] bg-[var(--icd-teal)]" />
            <div className="absolute right-[16px] top-[30px] size-[12px] bg-[var(--icd-teal)]" />
            <div className="absolute right-0 top-[40px] size-[12px] bg-[var(--icd-teal)]" />
          </div>
        </>
      )}
    </div>
  );
}
