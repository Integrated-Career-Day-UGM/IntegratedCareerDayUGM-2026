import { ArrowUpRight } from 'lucide-react';
import { registration } from '@/lib/data';
import { cn } from '@/lib/utils/cn';
import { surfaceClasses } from '@/lib/surface-classes';

/**
 * Registration entry points. Default: quiet surface rows for the mobile INFO
 * card. `bare`: black bars for the desktop paper container (label only, sharp
 * edges, thick white arrow, no surrounding fill).
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
        !bare && 'rounded-md border border-line p-2',
        !bare && surfaceClasses(2, 2),
        className,
      )}
    >
      <div className={bare ? 'grid gap-2' : 'grid gap-1.5'}>
        {items.map((item) => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'group flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
              bare
                ? 'font-canvas w-full rounded-none bg-transparent px-0 py-1.5 text-[15px] font-bold text-[#1d4ed8] underline decoration-[#1d4ed8] decoration-2 underline-offset-4 hover:text-[#1e40af] hover:decoration-[#1e40af]'
                : cn(
                    'h-12 w-full rounded-sm border border-line px-3 text-white hover:border-[#3a3a40] hover:bg-surface-4',
                    surfaceClasses(3, 3),
                  ),
            )}
          >
            <ArrowUpRight
              size={bare ? 18 : 16}
              strokeWidth={bare ? 3.2 : 2.2}
              className={cn(
                'shrink-0',
                bare
                  ? 'text-current'
                  : 'text-[#8f8f8f] transition-colors group-hover:text-[var(--accent-pink)]',
              )}
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-bold leading-tight">{item.label}</span>
              {!bare && (
                <span className="block text-[10px] leading-tight text-[#8f8f8f]">
                  {item.hint}
                </span>
              )}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
