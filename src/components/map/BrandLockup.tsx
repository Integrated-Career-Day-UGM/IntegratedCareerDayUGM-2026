import SelectionFrame from '../ui/SelectionFrame';
import { ui } from '../../lib/data';

const [lockupLine1, ...lockupRest] = ui.event.titleLine2.split(' ');
const lockupLine2 = lockupRest.join(' ');

/**
 * Header brand art (Figma 1742:24528): the rotated "Jelajahi Denah" ribbon
 * plus the UGM lockup in its pink selection frame.
 *
 * `default` reproduces the desktop sidebar header exactly (absolute blocks,
 * Figma geometry). `compact` reuses the same art as a scaled-down static
 * decoration — no positioning classes, so the caller places it (mobile
 * chrome, under the filter button).
 */
export default function BrandLockup({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <div className="-rotate-[1.2deg] bg-[#ff2d6f] px-2 pb-[1px] pt-0 font-heading text-[0.719rem] font-bold leading-[1.15] tracking-[-0.3px] text-white shadow-[0_1px_0_rgba(0,0,0,0.25)]">
          {ui.event.exploreBadge}
        </div>
        <SelectionFrame frameClassName="-left-[2px] -top-[3px] -right-[12px] -bottom-[4px]">
          <div
            className="flex items-center gap-[1px]"
            aria-label={ui.event.titleLine1 + ' ' + ui.event.titleLine2}
          >
            <span className="font-heading shrink-0 text-[1.4375rem] font-bold leading-[0.8] tracking-[-1.1px] text-white">
              {ui.event.titleLine1}
            </span>
            <span className="font-heading shrink-0 whitespace-nowrap text-[0.5625rem] font-bold leading-[0.95] tracking-[-0.3px] text-white">
              {lockupLine1}
              <br />
              {lockupLine2}
            </span>
          </div>
        </SelectionFrame>
      </div>
    );
  }

  return (
    <>
      {/* Rotated badge */}
      <div className="tag-ribbon absolute left-5 top-9 z-10">
        {ui.event.exploreBadge}
      </div>

      {/* UGM lockup + selection box (Figma 1742:24528); the frame extends
          past the text on the right and below, per design */}
      <div className="absolute left-6 top-[84px]">
        <SelectionFrame frameClassName="-left-[4px] -top-[5px] -right-[22px] -bottom-[7px]">
          <div
            className="flex items-center gap-[2px]"
            aria-label={ui.event.titleLine1 + ' ' + ui.event.titleLine2}
          >
            <span className="font-heading shrink-0 text-[44px] font-bold leading-[0.8] tracking-[-2px] text-white">
              {ui.event.titleLine1}
            </span>
            <span className="font-heading shrink-0 whitespace-nowrap text-[18px] font-bold leading-[0.95] tracking-[-0.5px] text-white">
              {lockupLine1}
              <br />
              {lockupLine2}
            </span>
          </div>
        </SelectionFrame>
      </div>
    </>
  );
}
