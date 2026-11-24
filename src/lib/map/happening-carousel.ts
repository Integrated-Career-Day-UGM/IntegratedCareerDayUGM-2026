import { sessions, event, ui } from '../data';
import type { Session } from '../../types/map';

/**
 * The live-session card's data layer. Everything that decides WHICH session
 * shows, whether it is live, how far it has run and what comes next lives
 * here — the card only renders. Swapping the source (mock fixtures, another
 * day's list, a different event) means editing this module, never the JSX.
 */

/** How often the card advances to the next session. */
export const CAROUSEL_INTERVAL_MS = 5000;

/** Minutes since midnight in the event timezone (WIB). */
export function nowMinutes(): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: event.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
    const [h, m] = parts.split(':').map(Number);
    return h * 60 + m;
  } catch {
    return 0;
  }
}

/** Minutes since midnight in the event timezone, from an ISO timestamp. */
export function minuteOf(iso: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: event.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
    const [h, m] = parts.split(':').map(Number);
    return h * 60 + m;
  } catch {
    return 0;
  }
}

/** "13.00" (dotted, like the design) from an ISO timestamp, in WIB. */
export function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: event.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(new Date(iso))
      .replace(':', '.');
  } catch {
    return iso;
  }
}

/** "1 h 20 min" / "45 min" from a minute count. */
export function formatDuration(mins: number): string {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} h ${m > 0 ? `${m} min` : ''}`.trim();
  }
  return `${mins} min`;
}

export type DeckItem = {
  session: Session;
  live: boolean;
  ended: boolean;
  /** 0–100, only meaningful while live (100 once ended, 0 before). */
  progress: number;
  countdown: string;
  label: string;
  /** The next session on the day's timeline, if any. */
  next: Session | null;
};

/**
 * The day's sessions annotated for the card. `isToday` gates the relative
 * countdown copy: on other days only the absolute time range is honest.
 */
export function buildSessionDeck(dayId: string, minutes: number, isToday: boolean): DeckItem[] {
  const daySessions = sessions
    .filter((s) => s.dayId === dayId)
    .sort((a, b) => a.start.localeCompare(b.start));

  return daySessions.map((session, i) => {
    const startMin = minuteOf(session.start);
    const endMin = minuteOf(session.end);
    const live = minutes >= startMin && minutes < endMin;
    const ended = minutes >= endMin;
    const progress = live
      ? ((minutes - startMin) / (endMin - startMin)) * 100
      : ended
        ? 100
        : 0;
    const countdown = live
      ? `Ends in ${formatDuration(endMin - minutes)}`
      : ended
        ? ui.happeningNow.endedLabel
        : isToday
          ? `Starts in ${formatDuration(startMin - minutes)}`
          : '';

    return {
      session,
      live,
      ended,
      progress,
      countdown,
      label: live
        ? ui.happeningNow.badge
        : ended
          ? ui.happeningNow.endedLabel
          : ui.happeningNow.nextLabel,
      next: daySessions[i + 1] ?? null,
    };
  });
}

/** First index worth showing: the live session, else the next upcoming one. */
export function firstDeckIndex(deck: DeckItem[]): number {
  const live = deck.findIndex((d) => d.live);
  if (live >= 0) return live;
  const upcoming = deck.findIndex((d) => !d.ended);
  if (upcoming >= 0) return upcoming;
  return Math.max(0, deck.length - 1);
}
