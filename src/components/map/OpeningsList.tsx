import { useMemo, useRef } from 'react';
import { useFluidHover } from '../../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
import { ui } from '../../lib/data';
import type { JobOpening } from '../../types/map';

/**
 * Grouped job openings with the gliding hover highlight — the exact block
 * the booth detail card renders, shared with the walk-in detail card so
 * both read identically.
 */
export default function OpeningsList({ openings }: { openings: JobOpening[] }) {
  const openingsRef = useRef<HTMLDivElement>(null);
  const openingsHover = useFluidHover(openingsRef);

  // Openings are grouped by contract type; one fluid hover glides across the
  // whole list like the search results.
  const openingsGroups = useMemo(() => {
    const groups: { type: string; roles: JobOpening[] }[] = [];
    for (const role of openings) {
      let group = groups.find((g) => g.type === role.type);
      if (!group) {
        group = { type: role.type, roles: [] };
        groups.push(group);
      }
      group.roles.push(role);
    }
    return groups;
  }, [openings]);

  if (!openings.length) return null;

  let flatIndex = 0;

  return (
    <div className="border-t border-line p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="section-label">{ui.boothDetail.opportunitiesLabel}</div>
          <span
            title={ui.boothDetail.mockDataHint}
            className="shrink-0 border border-[#f0c71d]/35 bg-[#f0c71d]/10 px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.12em] text-[#f0c71d]"
          >
            {ui.boothDetail.mockDataLabel}
          </span>
        </div>
        <span className="font-heading text-[11px] font-semibold text-ink-dim">
          {openings.length}
        </span>
      </div>

      <div ref={openingsRef} className="relative" {...openingsHover.handlers}>
        <FluidHoverHighlight hover={openingsHover} className="bg-[#1f1f23]" />
        {openingsGroups.map((group) => (
          <div key={group.type} className="mb-2 last:mb-0">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f8f8f]">
                {group.type}
              </span>
              <span className="text-[10px] tabular-nums text-[#8f8f8f]">
                {group.roles.length}
              </span>
            </div>
            {group.roles.map((role) => {
              const index = flatIndex++;
              return (
                <div
                  key={`${group.type}-${role.title}-${index}`}
                  ref={(el) => openingsHover.registerItem(index, el)}
                  className="relative flex items-center justify-between gap-3 px-2 py-2"
                >
                  <span className="text-[13px] font-medium leading-snug text-white">
                    {role.title}
                  </span>
                  <span className="shrink-0 text-[10.5px] text-[#8f8f8f]">
                    {role.type}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
