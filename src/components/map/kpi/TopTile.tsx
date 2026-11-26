import { cn } from '../../../lib/utils/cn';

type TopRow = { label: string; value: string | number };

type TopTileProps = {
  label: string;
  value?: string;
  tags?: string[];
  rows?: TopRow[];
  caption?: string;
  className?: string;
};

/** Text-only insight cell for "top company / tag / location" facts. */
export default function TopTile({
  label,
  value,
  tags,
  rows,
  caption,
  className,
}: TopTileProps) {
  return (
    <article
      className={cn(
        'flex min-w-0 flex-col gap-2 overflow-hidden bg-[#141416] p-3 text-white',
        className,
      )}
    >
      <p className="truncate text-[11px] font-medium text-[#8f8f8f]">{label}</p>
      {tags && tags.length > 0 ? (
        <span className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded-full border border-line bg-[#1f1f23] px-2 py-0.5 text-[11px] font-medium leading-snug text-[#d4d4d8]"
            >
              {tag}
            </span>
          ))}
        </span>
      ) : rows && rows.length > 0 ? (
        <span className="flex flex-col gap-1">
          {rows.map((row, index) => (
            <span
              key={`${row.label}-${index}`}
              className="flex items-baseline justify-between gap-2"
            >
              <span className="min-w-0 break-words text-[11px] leading-snug text-[#a1a1aa]">
                {row.label}
              </span>
              <span className="shrink-0 text-[12px] font-semibold tabular-nums text-white">
                {row.value}
              </span>
            </span>
          ))}
        </span>
      ) : (
        <p className="break-words text-balance font-heading text-[17px] font-bold leading-tight text-white">
          {value}
        </p>
      )}
      {caption && (
        <p className="mt-auto text-[11px] leading-4 text-[#8f8f8f]">{caption}</p>
      )}
    </article>
  );
}
