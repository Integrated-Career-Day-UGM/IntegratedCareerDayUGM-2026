import { ArrowUpRight, type LucideIcon } from 'lucide-react';

interface CtaBarProps {
  /** External link — renders an <a>. Omit for a <button> wired to onClick. */
  href?: string;
  label: string;
  onClick?: () => void;
  /** Slab glyph; defaults to the outbound arrow. */
  icon?: LucideIcon;
}

const slabClass =
  'cta-bar group relative flex h-9 w-full items-center gap-2 overflow-hidden bg-white pl-2 pr-3 text-black transition-transform duration-150 focus-visible:bg-[var(--accent-pink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.99]';

/**
 * White slab CTA shared by the booth and walk-in detail cards. Markup is
 * identical to the original inline BoothDetail CTA (same classes, same
 * cta-fill/cta-content structure) — extracting it changed nothing visually.
 */
export default function CtaBar({ href, label, onClick, icon: Icon = ArrowUpRight }: CtaBarProps) {
  const inner = (
    <>
      <span
        aria-hidden="true"
        className="cta-fill pointer-events-none absolute inset-0 bg-[var(--accent-pink)]"
      />
      <Icon size={14} strokeWidth={2.4} className="cta-content relative z-10 shrink-0" />
      <span className="cta-content relative z-10 font-heading text-[13px] leading-none font-bold tracking-[-0.1px]">
        {label}
      </span>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={onClick}
        className={slabClass}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={slabClass}>
      {inner}
    </button>
  );
}
