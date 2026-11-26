import { useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../../lib/utils/cn';

export type KpiData = {
  label: string;
  value: number | null;
  format?: (value: number) => string;
  delta?: number;
  deltaLabel?: string;
  lowerIsBetter?: boolean;
  trend?: number[];
  trendLabels?: string[];
  /** Compact x-axis labels under the bars; falls back to trendLabels. */
  trendShortLabels?: string[];
  /** Shown under the value when no bar is hovered ("by sector", "by day"). */
  seriesLabel?: string;
  /** Static caption for the simple stat variant. */
  caption?: string;
  loading?: boolean;
};

export interface KpiTileProps extends KpiData {
  className?: string;
  /** Bar accent; defaults to the page pink. */
  accent?: string;
  /** `stat` is the shared label/value/caption cell; `kpi` adds the bar chart. */
  variant?: 'stat' | 'kpi';
}

const decimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function deltaDirection(delta: number) {
  return delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
}

const EASE = [0.22, 1, 0.36, 1] as const;

function placeBars(
  trend: number[],
  labels?: string[],
  shortLabels?: string[],
) {
  const kept = trend.flatMap((value, index) =>
    Number.isFinite(value)
      ? [
          {
            label: labels?.[index] ?? `${index + 1}`,
            shortLabel: shortLabels?.[index] ?? labels?.[index] ?? `${index + 1}`,
            value,
          },
        ]
      : []
  );
  if (kept.length === 0) return [];
  const max = Math.max(...kept.map((point) => point.value), 1);
  return kept.map(({ label, shortLabel, value }) => ({
    label,
    shortLabel,
    value,
    heightPct: value > 0 ? Math.max((value / max) * 100, 4) : 0,
  }));
}

export default function KpiTile({
  label,
  value,
  format = decimal.format,
  delta,
  trend = [],
  trendLabels,
  trendShortLabels,
  seriesLabel,
  caption: captionProp,
  loading = false,
  className,
  accent = 'var(--accent-pink)',
  variant = 'kpi',
}: KpiTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const reduceMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const showChart = variant === 'kpi';
  const points = showChart
    ? placeBars(trend, trendLabels, trendShortLabels)
    : [];
  const last = points.length - 1;
  const at = activeIndex === null || last < 1 ? null : Math.min(activeIndex, last);
  const point = at === null ? undefined : points[at];
  const isEmpty = value === null || value === undefined || !Number.isFinite(value);
  const hasDelta = delta !== undefined && Number.isFinite(delta) && !isEmpty;
  const direction = deltaDirection(hasDelta ? delta : 0);
  const shownValue = point ? format(point.value) : isEmpty ? '—' : format(value as number);
  const caption = point ? point.label : (seriesLabel ?? captionProp ?? '');

  const Arrow = direction === 'down' ? ArrowDownRight : ArrowUpRight;

  return (
    <article
      ref={ref}
      className={cn(
        'flex min-w-0 flex-col gap-2 overflow-hidden p-3 text-white',
        className
      )}
      aria-busy={loading || undefined}
    >
      <p className="truncate text-[11px] font-medium text-[#8f8f8f]">{label}</p>

      {loading ? (
        <>
          <div className="h-6 w-20 skeleton-shimmer" />
          <div className="h-4 w-24 skeleton-shimmer" />
          {showChart && <div className="h-11 w-full skeleton-shimmer" />}
        </>
      ) : (
        <>
          <div className="flex h-6 flex-wrap items-baseline gap-2 overflow-hidden">
            <span className="inline-block min-w-[4.5ch] text-left font-heading text-[24px] font-bold leading-none tabular-nums text-white">
              {shownValue}
            </span>
            {hasDelta ? (
              <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-medium text-ink-body')}>
                <Arrow size={13} />
                {`${Math.abs(delta).toFixed(1)}%`}
              </span>
            ) : null}
          </div>

          {/* One shared caption slot: the KPI series/hover label, or the
              static stat caption. Fixed height so hover never resizes the
              bento cell. */}
          <p className="h-4 truncate text-[11px] leading-4 text-[#8f8f8f]">
            {caption}
          </p>

          {showChart && (
            <div className="mt-0.5">
              <div className="relative h-11">
                {points.length < 2 ? (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#9b9b9b]">
                    <Minus size={14} />
                  </div>
                ) : (
                  <>
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-0 bottom-0"
                    >
                      {[0, 25, 50, 75].map((mark) => (
                        <span
                          key={mark}
                          className="absolute inset-x-0 border-t border-[#232326]"
                          style={{ top: `${mark}%` }}
                        />
                      ))}
                    </div>
                    <div
                      className="relative flex h-full items-end gap-[2px]"
                      onPointerLeave={() => setActiveIndex(null)}
                    >
                      {points.map((bar, index) => (
                        <button
                          key={`${bar.label}-${index}`}
                          type="button"
                          aria-label={`${bar.label}: ${format(bar.value)}`}
                          className="flex h-full flex-1 items-end outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                          onPointerEnter={() => setActiveIndex(index)}
                          onFocus={() => setActiveIndex(index)}
                          onBlur={() => setActiveIndex(null)}
                          onClick={() => setActiveIndex(index)}
                        >
                          <motion.span
                            className="mx-auto block w-full max-w-10 rounded-t-[3px]"
                            initial={reduceMotion ? false : { height: 0 }}
                            animate={{
                              height: isInView ? `${bar.heightPct}%` : 0,
                            }}
                            transition={
                              reduceMotion
                                ? { duration: 0 }
                                : {
                                    duration: 0.45,
                                    ease: EASE,
                                    delay: index * 0.045,
                                  }
                            }
                            style={{
                              backgroundColor: accent,
                              opacity:
                                activeIndex === null || activeIndex === index
                                  ? 1
                                  : 0.35,
                            }}
                          />
                        </button>
                      ))}
                    </div>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#2f2f34]"
                    />
                  </>
                )}
              </div>

              {points.length > 1 && points.length <= 3 && (
                <div className="mt-1 flex gap-[2px]">
                  {points.map((bar, index) => (
                    <span
                      key={`${bar.label}-axis-${index}`}
                      className={cn(
                        'min-w-0 flex-1 truncate text-center text-[0.625rem] leading-none transition-colors',
                        activeIndex === index
                          ? 'text-white'
                          : 'text-[#8f8f8f]',
                      )}
                    >
                      {bar.shortLabel}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}
