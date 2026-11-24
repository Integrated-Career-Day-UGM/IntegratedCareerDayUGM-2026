import { ArrowUpRight } from 'lucide-react';
import { registration } from '@/lib/data';
import { cn } from '@/lib/utils/cn';
import { surfaceClasses } from '@/lib/surface-classes';

/**
 * Registration entry points. Quiet surface rows, no white cards and no
 * section label: the two destinations are self-explanatory.
 */
export default function RegisterCtas({ className }: { className?: string }) {
  const items = [registration.ugm, registration.nonUgm];

  return (
    <div className={cn('rounded-md border border-line p-2', surfaceClasses(2, 2), className)}>
      <div className="grid gap-1.5">
        {items.map((item) => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'group flex h-12 w-full items-center gap-2.5 rounded-sm border border-line px-3 text-white transition-colors hover:border-[#3a3a40] hover:bg-surface-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-pink)]',
              surfaceClasses(3, 3),
            )}
          >
            <ArrowUpRight
              size={16}
              strokeWidth={2.2}
              className="shrink-0 text-[#8f8f8f] transition-colors group-hover:text-[var(--accent-pink)]"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-bold leading-tight">{item.label}</span>
              <span className="block text-[10px] leading-tight text-[#8f8f8f]">
                {item.hint}
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
