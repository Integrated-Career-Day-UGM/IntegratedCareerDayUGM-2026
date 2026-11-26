import { useMemo, useState } from 'react';
import { ArrowUpRight, Calendar, Clock, MapPin } from 'lucide-react';
import EmptyState from '../../components/map/EmptyState';
import PosterGalleryModal from '../../components/map/PosterGalleryModal';
import {
  AccordionContent,
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';
import { careerFairMeta, ui } from '../../lib/data';
import type { JobOpening } from '../../types/map';

/**
 * Grouped job openings. Each role is an FF accordion row: title + program
 * group in the header, qualification/preference/apply details in the panel.
 * Company-level dates and program links live in the detail card above.
 */
export default function OpeningsList({ openings }: { openings: JobOpening[] }) {
  const [poster, setPoster] = useState<JobOpening | null>(null);

  const groups = useMemo(() => {
    const next: { program: string; roles: JobOpening[] }[] = [];
    for (const role of openings) {
      const program = role.program ?? role.type;
      let group = next.find((item) => item.program === program);
      if (!group) {
        group = { program, roles: [] };
        next.push(group);
      }
      group.roles.push(role);
    }
    return next;
  }, [openings]);

  if (!openings.length) {
    const unavailable = careerFairMeta.status === 'unavailable';
    return (
      <div className="border-t border-line p-3">
        <div className="section-label mb-2">{ui.boothDetail.opportunitiesLabel}</div>
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
        <div className="section-label">{ui.boothDetail.opportunitiesLabel}</div>
        <span className="font-heading text-[0.75rem] font-semibold text-ink-dim">
          {openings.length}
        </span>
      </div>

      <AccordionGroup type="single" collapsible highlight="trigger" className="w-full">
        {groups.map((group) => (
          <div key={group.program} className="mb-4 w-full last:mb-0">
            <div className="flex w-full items-start justify-between gap-3 border-b border-[#232326] px-2 pb-2">
              <span className="min-w-0 flex-1 line-clamp-2 text-[0.6875rem] font-semibold uppercase leading-snug tracking-[0.08em] text-[#8f8f8f]">
                {group.program}
              </span>
              <span className="shrink-0 pt-0.5 text-[0.6875rem] tabular-nums text-[#8f8f8f]">
                {group.roles.length}
              </span>
            </div>

            {group.roles.map((role) => {
              const index = flatIndex++;
              return (
                <AccordionItem
                  key={role.id}
                  value={role.id}
                  index={index}
                  className="w-full border-b border-[#232326] last:border-b-0"
                >
                  <AccordionTrigger className="w-full py-3">
                    <span className="flex w-full min-w-0 items-start gap-2">
                      <span className="min-w-0 flex-1 line-clamp-2 break-words text-[1rem] font-semibold leading-snug text-white md:text-[0.875rem]">
                        {role.title}
                      </span>
                    </span>
                  </AccordionTrigger>

                  <AccordionContent className="px-3 pb-4">
                    {role.description && (
                      <p className="text-[0.8125rem] leading-snug text-[#d4d4d8] md:text-[11.5px]">
                        {role.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.75rem] text-[#a1a1aa] md:text-[11px]">
                      {role.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} strokeWidth={1.7} />
                          {role.location}
                        </span>
                      )}
                      {role.intakeCount != null && (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} strokeWidth={1.7} />
                          {ui.boothDetail.intakeLabel} {role.intakeCount}
                        </span>
                      )}
                      {role.deadlineLabel && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} strokeWidth={1.7} />
                          {role.deadlineLabel}
                        </span>
                      )}
                    </div>

                    {role.qualifications && role.qualifications.length > 0 && (
                      <div className="mt-2">
                        <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#8f8f8f]">
                          {ui.boothDetail.qualificationsLabel}
                        </div>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[0.75rem] leading-snug text-[#d4d4d8] md:text-[11px]">
                          {role.qualifications.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {role.preferences && role.preferences.length > 0 && (
                      <div className="mt-2">
                        <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#8f8f8f]">
                          {ui.boothDetail.preferencesLabel}
                        </div>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[0.75rem] leading-snug text-[#d4d4d8] md:text-[11px]">
                          {role.preferences.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(role.applyUrl || role.posterUrl) && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        {role.applyUrl && (
                          <a
                            href={role.applyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 bg-white px-3 py-1.5 text-[0.75rem] font-bold text-black transition-colors hover:bg-[var(--accent-pink)] md:text-[11px]"
                          >
                            {role.applyLabel && role.applyLabel.length <= 30
                              ? role.applyLabel
                              : ui.boothDetail.applyLabel}
                            <ArrowUpRight size={13} strokeWidth={2.2} />
                          </a>
                        )}
                        {role.posterUrl && (
                          <button
                            type="button"
                            onClick={() => setPoster(role)}
                            className="text-[0.75rem] font-semibold text-[#d4d4d8] underline underline-offset-2 hover:text-white md:text-[11px]"
                          >
                            Open poster
                          </button>
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </div>
        ))}
      </AccordionGroup>

      {poster?.posterUrl && (
        <PosterGalleryModal
          items={[
            {
              id: poster.id,
              companyId: 'opening',
              companyName: poster.title,
              companyShortName: poster.type,
              kind: 'gallery',
              title: poster.title,
              src: poster.posterUrl,
              thumbUrl: poster.posterUrl,
              downloadUrl: poster.posterDownloadUrl ?? poster.posterUrl,
            },
          ]}
          heading={poster.title}
          index={0}
          onClose={() => setPoster(null)}
        />
      )}
    </div>
  );
}
