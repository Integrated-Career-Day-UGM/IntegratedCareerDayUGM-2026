import { Image as ImageIcon, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMapStore } from '../../stores/mapStore';
import CtaBar from '../../components/map/CtaBar';
import OpeningsList from '../../components/map/OpeningsList';
import CompanySessions from '../../components/map/CompanySessions';
import PosterModal from '../../components/map/PosterModal';
import usePosterAvailable from '../../hooks/map/usePosterAvailable';
import { track } from '../../lib/analytics';
import {
  event,
  getBoothByCode,
  getCompany,
  getWalkInBookings,
  ui,
} from '../../lib/data';
import { formatTime } from '../../lib/map/happening-carousel';
import type { WalkInSession } from '../../types/map';

/** Gold accent for the 2F walk-in rooms (matches the room fill + tooltip). */
const WALK_IN_ACCENT = '#6d6a16';

/** "28 Nov" for a day id, in the event locale (same format as the 2F plan). */
const dayLabel = (dayId: string) => {
  const day = event.days.find((d) => d.id === dayId);
  return day
    ? new Date(`${day.date}T00:00:00Z`).toLocaleDateString(event.locale, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      })
    : '';
};

/**
 * One walk-in booking card — same card anatomy as BoothDetail: cover, chips,
 * description, CTAs, the company's other sessions, then openings. Rendered
 * once per booking, so a bilik hosting several companies shows every card.
 */
function WalkInBookingCard({ booking }: { booking: WalkInSession }) {
  const selectWalkInRoom = useMapStore((s) => s.selectWalkInRoom);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const [posterOpen, setPosterOpen] = useState(false);

  const company = booking.companyId ? getCompany(booking.companyId) : undefined;
  const booth = booking.boothRef ? getBoothByCode(booking.boothRef) : undefined;
  const title = company?.name ?? booking.companyName;
  const posterAvailable = usePosterAvailable(company?.posterUrl);
  const hasPoster = Boolean(company?.posterUrl && posterAvailable);
  const hasLinks = Boolean(
    booth || hasPoster || company?.websiteUrl || company?.programUrl,
  );

  return (
    <section className="border border-line bg-[#141416]">
      {/* Cover + close — same treatment as the booth card, gold accent. */}
      <div
        className="relative h-14 w-full overflow-hidden border-b border-line"
        style={{
          background: `linear-gradient(135deg, ${WALK_IN_ACCENT}33 0%, #141416 70%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center px-16">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="" className="max-h-8 w-auto object-contain" />
          ) : null}
        </div>

        <span
          className="absolute bottom-1.5 left-2 px-1.5 py-0.5 text-[0.6875rem] font-bold text-white md:text-[10px]"
          style={{ backgroundColor: WALK_IN_ACCENT }}
        >
          {booking.room}
        </span>

        <div className="absolute right-1 top-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => selectWalkInRoom(null)}
            className="flex size-11 items-center justify-center text-white transition-colors hover:text-white/70 active:scale-95 md:size-8"
            aria-label={ui.boothDetail.closeLabel}
            title={ui.boothDetail.closeLabel}
          >
            <X size={24} className="md:h-5 md:w-5" />
          </button>
        </div>
      </div>

      <div className="px-3 pt-3">
        {/* Ribbon-style label (Jelajahi Denah treatment, not rotated) */}
        <div className="inline-block bg-[var(--accent-pink)] px-2 py-0.5 font-heading text-[0.6875rem] font-bold leading-tight text-white md:text-[10px]">
          {ui.walkInDetail.selectedLabel}
        </div>
        <h2 className="mt-1.5 font-heading text-[1.375rem] font-extrabold leading-[1.1] tracking-[-0.4px] text-white md:text-[20px]">
          {title}
        </h2>
      </div>

      {/* Booking chips: time range, bilik, day */}
      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 border-t border-line px-3 py-2">
        <span className="bg-[var(--accent-pink)] px-1.5 py-0.5 text-[0.75rem] font-bold text-white md:text-[11px]">
          {formatTime(booking.start)} - {formatTime(booking.end)} WIB
        </span>
        <span className="bg-[#1f1f23] px-1.5 py-0.5 text-[0.75rem] font-medium text-[#d4d4d8] md:text-[11px]">
          {ui.walkInDetail.roomPrefix} {booking.room}
        </span>
        <span className="bg-[#1f1f23] px-1.5 py-0.5 text-[0.75rem] font-medium text-[#d4d4d8] md:text-[11px]">
          {dayLabel(booking.dayId)}
        </span>
      </div>

      {company?.tags.length ? (
        <div className="flex flex-wrap gap-1.5 border-t border-line px-3 py-2">
          {company.tags.map((tag) => (
            <span key={tag} className="bg-[#1f1f23] px-1.5 py-0.5 text-[0.75rem] text-[#d4d4d8] md:text-[11px]">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {company?.description ? (
        <p className="border-t border-line px-3 py-2 text-[0.8125rem] leading-snug text-[#d4d4d8] md:text-[11.5px]">
          {company.description}
        </p>
      ) : !company ? (
        <p className="border-t border-line px-3 py-2 text-[0.8125rem] leading-snug text-ink-dim md:text-[11.5px]">
          {ui.walkInDetail.noCompanyHint}
        </p>
      ) : null}

      {/* Cross-link into the career-expo company detail, then the company's
          own outbound CTAs — same slabs as the booth card. */}
      {hasLinks && (
        <div className="space-y-2 border-t border-line p-3">
          {booth && (
            <CtaBar
              label={ui.walkInDetail.openCompanyCta}
              onClick={() => {
                track('cta.click', { boothId: booth.id, type: 'company-detail' });
                selectBooth(booth.id);
              }}
            />
          )}
          {hasPoster && (
            <CtaBar
              icon={ImageIcon}
              label={ui.boothDetail.posterCta}
              onClick={() => {
                setPosterOpen(true);
                track('cta.click', {
                  boothId: booth?.id ?? null,
                  type: 'poster',
                  url: company?.posterUrl,
                });
              }}
            />
          )}
          {company?.websiteUrl && (
            <CtaBar
              href={company.websiteUrl}
              label={ui.boothDetail.websiteCta}
              onClick={() =>
                track('cta.click', {
                  boothId: booth?.id ?? null,
                  type: 'website',
                  url: company.websiteUrl,
                })
              }
            />
          )}
          {company?.programUrl && (
            <CtaBar
              href={company.programUrl}
              label={ui.boothDetail.programCta}
              onClick={() =>
                track('cta.click', {
                  boothId: booth?.id ?? null,
                  type: 'program',
                  url: company.programUrl,
                })
              }
            />
          )}
        </div>
      )}

      {/* All of the company's other sessions — stage talks, track sessions
          and its other walk-in bookings — then the openings list, exactly
          like the booth detail card. */}
      <CompanySessions
        companyId={booking.companyId}
        companyName={booking.companyName}
        highlightId={booking.id}
      />
      {company && <OpeningsList openings={company.openings} />}

      <PosterModal
        poster={
          posterOpen && hasPoster && company?.posterUrl
            ? {
                id: company.id,
                title: company.name,
                subtitle: ui.boothDetail.posterCta,
                src: company.posterUrl,
                downloadUrl: company.posterDownloadUrl ?? company.posterUrl,
                accent: WALK_IN_ACCENT,
              }
            : null
        }
        onClose={() => setPosterOpen(false)}
        closeLabel={ui.boothDetail.closeLabel}
      />
    </section>
  );
}

/**
 * Sidebar detail for a selected walk-in bilik (F1–F10). A room can host
 * several companies across the day, so every booking on the visible day gets
 * its own card — driven by the walk-in sheet (walk-in.yaml →
 * walk-in-sessions.json) plus the company roster when a booking links to a
 * booth.
 */
export default function WalkInDetail() {
  const roomId = useMapStore((s) => s.selectedWalkInRoomId);
  const selectedDayId = useMapStore((s) => s.selectedDayId);

  const bookings = useMemo(
    () => (roomId ? getWalkInBookings(selectedDayId, roomId) : []),
    [roomId, selectedDayId],
  );

  if (!roomId || bookings.length === 0) return null;

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <WalkInBookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}
