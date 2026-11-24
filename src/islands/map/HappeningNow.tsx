import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import {
  getCompany,
  getArea,
  getBoothsByArea,
  getTodayDayId,
  event,
  ui,
} from '../../lib/data';
import {
  CAROUSEL_INTERVAL_MS,
  buildSessionDeck,
  firstDeckIndex,
  formatTime,
  nowMinutes,
  type DeckItem,
} from '../../lib/map/happening-carousel';
import { useMapStore } from '../../stores/mapStore';

/**
 * Live/upcoming session card. The deck (which session, live state, up-next)
 * comes from `lib/map/happening-carousel` — this component only renders it.
 *
 * Behaviour: auto-advances every 5s; pauses while hovered/focused/pinned or
 * when reduced motion is requested. Hover (or the footer button) expands the
 * card downward to reveal the next session in full.
 */
export default function HappeningNow() {
  const selectedDayId = useMapStore((s) => s.selectedDayId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const toggleBookmark = useMapStore((s) => s.toggleBookmark);
  // The array itself, not the isBookmarked() helper: without it the icon
  // renders once and never flips when toggled.
  const bookmarkedIds = useMapStore((s) => s.bookmarkedIds);
  // Tick every 30s so live status / countdown stay honest.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const isToday = selectedDayId === getTodayDayId();
  const minutes = isToday ? nowMinutes() : -1;
  const deck = buildSessionDeck(selectedDayId, minutes, isToday);
  const [index, setIndex] = useState(() => firstDeckIndex(deck));
  const reduceMotion = useReducedMotion() ?? false;

  // Auto-advance. Never under reduced motion.
  useEffect(() => {
    if (deck.length < 2 || reduceMotion) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % deck.length),
      CAROUSEL_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [deck.length, reduceMotion]);

  if (deck.length === 0) return null;

  const current: DeckItem = deck[((index % deck.length) + deck.length) % deck.length];
  const session = current.session;
  const live = current.live;
  const company = getCompany(session.companyId);
  const area = getArea(event.defaultVenueId, session.areaId);
  // Save targets the company's booth in the session's area (bookmarks are booth-based).
  const booth = getBoothsByArea(session.areaId).find((b) => b.companyId === session.companyId);
  const saved = booth ? bookmarkedIds.includes(booth.id) : false;

  const next = current.next;
  const nextCompany = next ? getCompany(next.companyId) : null;

  const openSession = () => {
    if (booth) selectBooth(booth.id);
    else setSelectedArea(session.areaId);
  };

  return (
    <section className="relative border border-line bg-[#0e0e0e] px-3 pb-2.5 pt-2 shadow-[4px_4px_0_var(--accent-pink)]">
      {/* Status chip floats on the top border, like the design */}
      <span
        className={`absolute right-3 top-[-10px] px-3 py-px font-heading text-[12px] font-bold ${
          live ? 'bg-white text-black' : 'bg-[#1c1c1c] text-ink-body'
        }`}
      >
        {current.label}
      </span>

      <div key={session.id} className="happening-enter">
        {/* Header row: marker + label | time range */}
        <div className="flex items-center justify-between font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-dim">
          <span className="flex items-center">
            <i
              className={`mr-[7px] h-2.5 w-2.5 shrink-0 bg-[var(--accent-pink)] ${
                live ? 'blink-dot' : ''
              }`}
            />
            {live ? ui.happeningNow.liveLabel : ui.happeningNow.nextLabel}
          </span>
          <span>
            {formatTime(session.start)} - {formatTime(session.end)} WIB
          </span>
        </div>

        {/* Title block — the card's primary action is opening the session's
            company detail. Bookmark stays as the only secondary action. */}
        <div className="mt-1 flex items-end justify-between gap-2">
          <button
            type="button"
            onClick={openSession}
            className="min-w-0 flex-1 text-left"
            aria-label={`Open ${session.title}`}
          >
            <h3 className="font-heading text-[17px] font-bold leading-tight tracking-[-0.3px] text-white">
              {session.title}
            </h3>
            <p className="text-[11px] leading-snug text-ink-dim">{company?.name}</p>
            <div className="mt-1 flex items-baseline justify-between gap-2 text-[11px] font-semibold">
              <span className="truncate text-ink-body">{area?.name}</span>
              {current.countdown && (
                <span className="shrink-0 text-[#f5b400]">{current.countdown}</span>
              )}
            </div>
          </button>

          {booth && (
            <div className="flex shrink-0 items-end">
              <button
                type="button"
                onClick={() => toggleBookmark(booth.id)}
                aria-label={saved ? ui.happeningNow.saved : ui.happeningNow.save}
                title={saved ? ui.happeningNow.saved : ui.happeningNow.save}
                className="flex size-[33px] items-center justify-center bg-chipfill transition-colors hover:bg-field-hover active:scale-[0.98]"
              >
                <Bookmark
                  size={16}
                  strokeWidth={2}
                  className={saved ? 'fill-current text-white' : 'fill-none text-white'}
                />
              </button>
            </div>
          )}
        </div>

        {/* Progress — fill only, no track, so it never reads as a divider */}
        <div className="my-1.5 h-[2px]">
          <div
            className="h-full bg-[var(--accent-pink)] transition-[width] duration-500"
            style={{ width: `${Math.min(100, Math.max(0, current.progress))}%` }}
          />
        </div>
      </div>

      {/* Footer: the single up-next line — the carousel above is the only
          session browser. */}
      <div className="mt-2 truncate border-t border-line pt-1.5 text-[11px] text-ink-dim">
        {next
          ? `${ui.happeningNow.upNext} ${formatTime(next.start)} ${next.title}${
              nextCompany ? `, ${nextCompany.name}` : ''
            }`
          : ui.happeningNow.noMoreSessions}
      </div>

      {/* Carousel index: one segment per session; the active segment fills
          across the 5s interval. Hidden from AT — the card itself announces
          the current session. */}
      <div className="mt-1.5 flex items-center gap-1" aria-hidden="true">
        {deck.map((item, i) => {
          const active = i === index % deck.length;
          return (
            <span
              key={item.session.id}
              className="relative h-[3px] min-w-0 flex-1 overflow-hidden bg-[#2a2a2a]"
            >
              {active && (
                <span
                  key={`${item.session.id}-${reduceMotion}`}
                  className={`absolute inset-y-0 left-0 bg-[var(--accent-pink)] ${
                    reduceMotion ? 'w-full' : 'animate-[carousel-fill_5s_linear_forwards]'
                  }`}
                />
              )}
            </span>
          );
        })}
      </div>
    </section>
  );
}
