import { useRef, useEffect, useState, useId } from 'react';
import { motion, animate, useMotionValue, useTransform, useInView } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export type KpiData = {
  label: string;
  value: number | null;
  format?: (value: number) => string;
  delta?: number;
  deltaLabel?: string;
  lowerIsBetter?: boolean;
  trend?: number[];
  trendLabels?: string[];
  loading?: boolean;
};

export interface KpiTileProps extends KpiData {
  className?: string;
}

const decimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function deltaTone(delta: number, lowerIsBetter = false) {
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const good = (direction === 'up') === !lowerIsBetter;
  return { direction, tone: direction === 'flat' ? 'neutral' : good ? 'positive' : 'negative' } as const;
}

const TONE_STYLES = {
  positive: 'text-emerald-400 bg-emerald-400/10',
  negative: 'text-rose-400 bg-rose-400/10',
  neutral: 'text-[#bbb] bg-[#575757]',
} as const;

const [W, H, PAD] = [100, 40, 3];
const EASE = [0.22, 1, 0.36, 1] as const;
const ROLL = { duration: 0.6, ease: EASE };
const INSTANT = { duration: 0 };

function placePoints(trend: number[], labels?: string[]) {
  const kept = trend.flatMap((value, index) =>
    Number.isFinite(value) ? [{ label: labels?.[index] ?? `${index + 1}`, value }] : []
  );
  if (kept.length === 0) return [];
  const min = Math.min(...kept.map((p) => p.value));
  const max = Math.max(...kept.map((p) => p.value));
  const span = max - min;
  const step = (W - PAD * 2) / Math.max(kept.length - 1, 1);
  return kept.map(({ label, value }, index) => ({
    label,
    value,
    x: PAD + index * step,
    y: span ? H - PAD - ((value - min) / span) * (H - PAD * 2) : H / 2,
  }));
}

export default function KpiTile({
  label,
  value,
  format = decimal.format,
  delta,
  deltaLabel,
  lowerIsBetter = false,
  trend = [],
  trendLabels,
  loading = false,
  className,
}: KpiTileProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const points = placePoints(trend, trendLabels);
  const last = points.length - 1;
  const at = activeIndex === null || last < 1 ? null : Math.min(activeIndex, last);
  const point = at === null ? undefined : points[at];
  const end = points[last];
  const isEmpty = value === null || value === undefined || !Number.isFinite(value);
  const hasDelta = delta !== undefined && Number.isFinite(delta) && !isEmpty;
  const { direction, tone } = deltaTone(hasDelta ? delta : 0, lowerIsBetter);

  const shownValue = useMotionValue(isEmpty ? 0 : (value ?? 0));
  const displayValue = useTransform(shownValue, (v) => {
    if (point) return format(point.value);
    if (isEmpty) return '—';
    return format(v);
  });

  useEffect(() => {
    if (point) {
      // Hovering a sparkline point: show that value instantly.
      shownValue.set(point.value);
      return;
    }
    if (!isInView || isEmpty) {
      shownValue.set(0);
      return;
    }
    const roll = animate(shownValue, value as number, ROLL);
    return () => roll.stop();
  }, [isInView, isEmpty, point, shownValue, value]);

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const area = end ? `${line} L${end.x} ${H} L${PAD} ${H} Z` : '';

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / Math.max(box.width, 1)) * W;
    const index = Math.round(((x - PAD) / (W - PAD * 2)) * last);
    setActiveIndex(last < 1 ? null : Math.min(Math.max(index, 0), last));
  };

  const Arrow = direction === 'down' ? ArrowDownRight : ArrowUpRight;

  return (
    <article
      ref={ref}
      className={cn(
        'flex min-w-0 flex-col gap-3 bg-[#4a4a4a] p-4 text-white',
        className
      )}
      aria-busy={loading || undefined}
    >
      <p className="truncate font-heading text-xs font-medium uppercase tracking-wide text-[#9b9b9b]">{label}</p>

      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-24 animate-pulse bg-[#575757]" />
          <div className="h-3 w-20 animate-pulse bg-[#575757]" />
          <div className="h-10 w-full animate-pulse bg-[#575757]" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <motion.span className="text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
              {displayValue}
            </motion.span>
            {hasDelta ? (
              <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium', TONE_STYLES[tone])}>
                <Arrow size={14} />
                {`${Math.abs(delta).toFixed(1)}%`}
              </span>
            ) : null}
          </div>

          <p className="min-h-4 truncate text-xs text-[#9b9b9b]">
            {point ? point.label : isEmpty ? 'No data yet' : deltaLabel}
          </p>

          <div className="relative h-10 rounded-sm">
            {points.length < 2 ? (
              <div className="flex h-full w-full items-center justify-center text-xs text-[#9b9b9b]">
                <Minus size={14} />
              </div>
            ) : (
              <>
                <svg
                  className="block h-full w-full touch-pan-y overflow-visible"
                  viewBox={`0 0 ${W} ${H}`}
                  preserveAspectRatio="none"
                  onPointerDown={handlePointer}
                  onPointerMove={handlePointer}
                  onPointerLeave={() => setActiveIndex(null)}
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#ff316b" stopOpacity={0.25} />
                      <stop offset="1" stopColor="#ff316b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <path d={area} fill={`url(#${id}-fill)`} />
                  <motion.path
                    d={line}
                    fill="none"
                    stroke="#ff316b"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0 }}
                    animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ duration: 0.9, ease: EASE }}
                  />
                </svg>
                {point && (
                  <span
                    className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-900 bg-[#ff316b]"
                    style={{
                      left: `${(point.x / W) * 100}%`,
                      top: `${(point.y / H) * 100}%`,
                    }}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}
    </article>
  );
}
