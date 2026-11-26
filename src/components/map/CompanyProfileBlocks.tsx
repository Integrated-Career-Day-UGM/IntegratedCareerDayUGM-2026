import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { ui } from '../../lib/data';
import humanizeLabel from '../../lib/humanize';
import type { CompanyProfile } from '../../types/map';

const humanize = humanizeLabel;

export function CategoryTag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-line bg-[#1f1f23] px-2 py-0.5 text-[0.75rem] text-[#d4d4d8] md:text-[11px]">
      {humanize(label)}
    </span>
  );
}

export function CompanyCategoryChips({ profile }: { profile?: CompanyProfile }) {
  const categories = Array.from(
    new Map(
      (profile?.categories ?? []).map((category) => [
        category.toLowerCase(),
        category,
      ]),
    ).values(),
  );
  if (!categories.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 border-t border-line px-3 py-2">
      {categories.map((category, index) => (
        <CategoryTag key={`${category}-${index}`} label={category} />
      ))}
    </div>
  );
}

/** Company-level dates and links. Role-specific detail lives in OpeningsList. */
export default function CompanyProfileBlocks({ profile }: { profile?: CompanyProfile }) {
  if (!profile) return null;
  const dates = profile.importantDates ?? [];
  const links = (profile.programLinks ?? []).filter((link) => link.label || link.url);

  if (!dates.length && !links.length) return null;

  return (
    <>
      {dates.length > 0 && (
        <section className="border-t border-line p-3">
          <div className="section-label mb-2">{ui.boothDetail.importantDatesLabel}</div>
          <div className="space-y-2">
            {dates.map((date, index) => (
              <div
                key={`${date.event}-${index}`}
                className="rounded-sm border border-line bg-[#0f0f12] p-2"
              >
                <div className="text-[0.8125rem] font-semibold leading-snug text-white md:text-[12px]">
                  {date.event}
                </div>
                {(date.date || date.time || date.location) && (
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[0.75rem] text-[#a1a1aa] md:text-[11px]">
                    {(date.date || date.time) && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} strokeWidth={1.7} />
                        {[date.date, date.time].filter(Boolean).join(' · ')}
                      </span>
                    )}
                    {date.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} strokeWidth={1.7} />
                        {date.location}
                      </span>
                    )}
                  </div>
                )}
                {date.note && (
                  <p className="mt-1 text-[0.75rem] leading-snug text-[#8f8f8f] md:text-[11px]">
                    {date.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {links.length > 0 && (
        <section className="border-t border-line p-3">
          <div className="section-label mb-2">{ui.boothDetail.programLinksLabel}</div>
          <div className="flex flex-wrap gap-1.5">
            {links.map((link, index) => {
              const key = `${link.label}-${index}`;
              return link.url ? (
                <a
                  key={key}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 border border-line bg-[#1a1a1e] px-2.5 py-1.5 text-[0.75rem] font-semibold text-white transition-colors hover:border-[var(--accent-pink)] md:text-[11px]"
                >
                  {link.label}
                  <ArrowUpRight size={12} strokeWidth={2} />
                </a>
              ) : (
                <span
                  key={key}
                  className="inline-flex items-center border border-line bg-[#1a1a1e] px-2.5 py-1.5 text-[0.75rem] font-semibold text-[#a1a1aa] md:text-[11px]"
                >
                  {link.label}
                </span>
              );
            })}
          </div>
          {profile.cta && (
            <p className="mt-2 text-[0.75rem] leading-snug text-[#8f8f8f] md:text-[11px]">
              {profile.cta}
            </p>
          )}
        </section>
      )}
    </>
  );
}
