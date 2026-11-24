import { ArrowUpRight } from 'lucide-react';
import { registration } from '@/lib/data';

/**
 * Registration entry points in a black menu panel. Bigger rows than the old
 * floating pair; the arrow is a plain glyph (no bordered tile). Hover keeps
 * the white → pink wipe and content flip from the booth CTAs.
 */
export default function RegisterCtas() {
  const items = [registration.ugm, registration.nonUgm];

  return (
    <div className="border border-[#34343a] bg-[#0c0c0f] p-2">
      <div className="section-label mb-2 px-1">Daftar</div>
      <div className="grid gap-1.5">
        {items.map((item) => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="cta-bar group relative flex h-12 w-full items-center gap-2.5 overflow-hidden bg-white pl-2.5 pr-3 text-black transition-transform duration-150 focus-visible:bg-[var(--accent-pink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.99]"
          >
            <span
              aria-hidden="true"
              className="cta-fill pointer-events-none absolute inset-0 bg-[var(--accent-pink)]"
            />
            <ArrowUpRight
              size={16}
              strokeWidth={2.4}
              className="cta-content relative z-10 shrink-0"
            />
            <span className="relative z-10 min-w-0">
              <span className="cta-content block text-[13px] font-bold leading-tight">
                {item.label}
              </span>
              <span className="cta-content block text-[10px] leading-tight opacity-60">
                {item.hint}
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
