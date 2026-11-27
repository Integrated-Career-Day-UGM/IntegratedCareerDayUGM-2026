import type { ChangelogEntry } from '../../lib/data';

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Minimal release timeline: round dot + hairline rail, version, date, one
 * sentence. No cards per row.
 */
export default function ChangelogStepper({ entries }: { entries: ChangelogEntry[] }) {
  return (
    <ol className="relative">
      {entries.map((entry, index) => (
        <li key={entry.version} className="relative flex gap-3 pb-4 last:pb-0">
          {index < entries.length - 1 && (
            <span
              className="absolute top-4 bottom-0 left-[5px] w-px bg-line"
              aria-hidden="true"
            />
          )}
          <span
            className={`relative z-10 mt-1 size-[11px] shrink-0 rounded-full ${
              index === 0 ? 'bg-[var(--accent-pink)]' : 'bg-[#3b3b42]'
            }`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-[0.8125rem] font-bold text-white">
                v{entry.version}
              </span>
              <span className="text-[0.625rem] text-[#71717a]">
                {dateFormat.format(new Date(`${entry.date}T00:00:00Z`))}
              </span>
            </div>
            <ul className="mt-1 space-y-0.5">
              {entry.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-1.5 text-[0.75rem] leading-snug text-[#a1a1aa]"
                >
                  <span
                    className="mt-[7px] size-[3px] shrink-0 rounded-full bg-[#52525b]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
