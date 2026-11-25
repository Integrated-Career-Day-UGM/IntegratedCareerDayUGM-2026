import { useMemo, useRef, useState } from 'react';
import { useFluidHover } from '../../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
import EmptyState from '../../components/map/EmptyState';
import PosterModal from '../../components/map/PosterModal';
import { useMapStore } from '../../stores/mapStore';
import { openingsMeta, ui } from '../../lib/data';
import type { JobOpening } from '../../types/map';

/**
 * Grouped job openings with the gliding hover highlight — the exact block
 * the booth detail card renders, shared with the walk-in detail card so
 * both read identically.
 */
export default function OpeningsList({ openings }: { openings: JobOpening[] }) {
  const openingsRef = useRef<HTMLDivElement>(null);
  const openingsHover = useFluidHover(openingsRef);
  const setSidebarTab = useMapStore((s) => s.setSidebarTab);
  const setPosterFocus = useMapStore((s) => s.setPosterFocus);
  const [poster, setPoster] = useState<JobOpening | null>(null);

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

  if (!openings.length) {
    const unavailable = openingsMeta.status === 'unavailable';
    return (
      <div className="border-t border-line p-3">
        <div className="section-label mb-2">
          {ui.boothDetail.opportunitiesLabel}
        </div>
        <EmptyState
          variant="inline"
          art={unavailable ? 'sad' : 'empty'}
          title={
            unavailable
              ? ui.boothDetail.openingsUnavailableTitle
              : ui.boothDetail.openingsEmptyTitle
          }
          description={
            unavailable
              ? ui.boothDetail.openingsUnavailableBody
              : ui.boothDetail.openingsEmptyBody
          }
          className="border-0 bg-transparent p-0"
        />
      </div>
    );
  }

  let flatIndex = 0;

  return (
    <div className="border-t border-line p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="section-label">{ui.boothDetail.opportunitiesLabel}</div>
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
                  key={role.id}
                  ref={(el) => openingsHover.registerItem(index, el)}
                  className="relative px-2 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-[13px] font-medium leading-snug text-white">
                      {role.title}
                    </span>
                    <span className="shrink-0 text-[10.5px] text-[#8f8f8f]">
                      {role.type}
                    </span>
                  </div>
                  {(role.location || role.posterUrl) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {role.location && (
                        <span className="text-[10px] text-[#8f8f8f]">
                          {role.location}
                        </span>
                      )}
                      {role.posterUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPoster(role)}
                            className="text-[10px] font-semibold text-[#d4d4d8] underline underline-offset-2 hover:text-white"
                          >
                            Open poster
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSidebarTab('info');
                              setPosterFocus(role.id);
                            }}
                            className="text-[10px] font-semibold text-[#8f8f8f] underline underline-offset-2 hover:text-white"
                          >
                            Open in Info
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <PosterModal
        poster={
          poster?.posterUrl
            ? {
                id: poster.id,
                title: poster.title,
                subtitle: poster.type,
                src: poster.posterUrl,
                accent: '#f0c71d',
                downloadUrl: poster.posterDownloadUrl ?? undefined,
              }
            : null
        }
        onClose={() => setPoster(null)}
      />
    </div>
  );
}
