import type { LucideIcon } from 'lucide-react';

/**
 * Minimal fixed map pin, ported from Base Web's `FixedMarker` anatomy:
 * a pill pin head (optional icon + label) and a thin needle below it.
 * No drag shadow, no enhancers, no badge.
 *
 * The head and needle are the only parts implemented; the pin is anchored
 * bottom-center by MapLibre, so the needle tip marks the coordinate.
 */
export default function FixedPin({
  label,
  color,
  icon: Icon,
}: {
  label?: string;
  color: string;
  icon?: LucideIcon;
}) {
  if (!label && !Icon) return null;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex items-center border border-white/15 bg-[#141416] shadow-[0_4px_14px_rgba(0,0,0,0.6)] ${
          label
            ? 'gap-1.5 rounded-full py-1 pl-1 pr-2.5 md:gap-2 md:py-1.5 md:pl-1.5 md:pr-3.5'
            : 'rounded-full p-1 md:p-1.5'
        }`}
      >
        {Icon && (
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-full md:size-6"
            style={{ backgroundColor: color }}
          >
            <Icon
              size={14}
              strokeWidth={2.4}
              fill="currentColor"
              className="h-3 w-3 text-white md:h-3.5 md:w-3.5"
            />
          </span>
        )}
        {label && (
          <span className="font-heading text-[0.6875rem] font-bold leading-none text-white md:text-[0.8125rem]">
            {label}
          </span>
        )}
      </div>
      {/* Needle: thin stem + square endpoint. */}
      <span className="h-2 w-[2px] bg-[#d4d4d8] md:h-2.5" />
      <span className="size-[4px] bg-[#71717a] md:size-[5px]" />
    </div>
  );
}
