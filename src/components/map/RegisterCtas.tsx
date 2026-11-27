import { ArrowUpRight } from 'lucide-react';
import { registration } from '@/lib/data';
import { cn } from '@/lib/utils/cn';
import { surfaceClasses } from '@/lib/surface-classes';
import CtaBar from './CtaBar';

/**
 * Registration entry points. Default: the shared white CtaBar slabs (same
 * component as the booth / walk-in detail), two-up in the mobile INFO card.
 * `bare`: the desktop paper container keeps its underlined label links.
 */
export default function RegisterCtas({
  className,
  bare = false,
}: {
  className?: string;
  bare?: boolean;
}) {
  const items = [registration.ugm, registration.nonUgm];

  return (
    <div
      className={cn(
        !bare && 'rounded-md border border-line p-1.5',
        !bare && surfaceClasses(2, 2),
        className,
      )}
    >
      <div className={bare ? 'flex flex-col gap-2' : 'flex gap-1.5'}>
        {items.map((item) =>
          bare ? (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="font-canvas group flex w-full items-center gap-2.5 rounded-none bg-transparent px-0 py-1.5 text-[15px] font-bold text-[#1d4ed8] underline decoration-[#1d4ed8] decoration-2 underline-offset-4 transition-colors hover:text-[#1e40af] hover:decoration-[#1e40af] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              <ArrowUpRight size={18} strokeWidth={3.2} className="shrink-0" />
              <span className="min-w-0 text-[15px] font-bold leading-tight">{item.label}</span>
            </a>
          ) : (
            <CtaBar key={item.url} href={item.url} label={item.label} fit />
          ),
        )}
      </div>
    </div>
  );
}
