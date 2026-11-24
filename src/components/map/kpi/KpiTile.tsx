import { useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
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
  /** Shown under the value when no bar is hovered ("by sector", "by day"). */
  seriesLabel?: string;
  loading?: boolean;
};

export interface KpiTileProps extends KpiData {
  className?: string;
  /** Bar accent; defaults to the page pink. */
  accent?: string;
}

const decimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function deltaDirection(delta: number) {
  return delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
}

const [W, H, PAD] = [100, 40, 3];
const EASE = [0.22, 1, 0.36, 1] as const;

function placeBars(trend: number[], labels?: string[]) {
  const kept = trend.flatMap((value, index) =>
    Number.isFinite(value) ? [{ label: labels?.[index] ?? `${index + 1}`, value }] : []
  );
  if (kept.length === 0) return [];
  const max = Math.max(...kept.map((point) => point.value), 1);
  const slot = (W - PAD * 2) / kept.length;
  const width = Math.max(1.5, slot * 0.58);
  return kept.map(({ label, value }, index) => {
    const height =
      value > 0 ? Math.max((value / max) * (H - PAD * 2), 1.5) : 0;
    return {
      label,
      value,
      x: PAD + index * slot + (slot - width) / 2,
      y: H - PAD - height,
      width,
      height,
    };
  });
}

export default function KpiTile({
  label,
  value,
  format = decimal.format,
  delta,
  trend = [],
  trendLabels,
  seriesLabel,
  loading = false,
  className,
  accent = 'var(--accent-pink)',
}: KpiTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const points = placeBars(trend, trendLabels);
  const last = points.length - 1;
  const at = activeIndex === null || last < 1 ? null : Math.min(activeIndex, last);
  const point = at === null ? undefined : points[at];
  const isEmpty = value === null || value === undefined || !Number.isFinite(value);
  const hasDelta = delta !== undefined && Number.isFinite(delta) && !isEmpty;
  const direction = deltaDirection(hasDelta ? delta : 0);
  const shownValue = point ? format(point.value) : isEmpty ? '—' : format(value as number);

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / Math.max(box.width, 1)) * W;
    const slot = (W - PAD * 2) / Math.max(points.length, 1);
    const index = Math.floor((x - PAD) / slot);
    setActiveIndex(
      points.length < 2 ? null : Math.min(Math.max(index, 0), points.length - 1)
    );
  };

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
        <div className="space-y-2">
          <div className="h-7 w-20 animate-pulse bg-[#26262b]" />
          <div className="h-3 w-16 animate-pulse bg-[#26262b]" />
          <div className="h-9 w-full animate-pulse bg-[#26262b]" />
        </div>
      ) : (
        <>
          <div className="flex h-6 flex-wrap items-baseline gap-2 overflow-hidden">
            <span className="inline-block min-w-[4.5ch] text-left text-[22px] font-semibold leading-none tabular-nums tracking-tight text-white">
              {shownValue}
            </span>
            {hasDelta ? (
              <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-medium text-ink-body')}>
                <Arrow size={13} />
                {`${Math.abs(delta).toFixed(1)}%`}
              </span>
            ) : null}
          </div>

          {/* Only the hovered bar label; at rest it names the series. Fixed
              height so hovering never resizes the bento cell. */}
          <p className="h-4 truncate text-[11px] leading-4 text-[#8f8f8f]">
            {point ? point.label : (seriesLabel ?? '')}
          </p>

          <div className="relative h-9">
            {points.length < 2 ? (
              <div className="flex h-full w-full items-center justify-center text-xs text-[#9b9b9b]">
                <Minus size={14} />
              </div>
            ) : (
              <svg
                className="block h-full w-full touch-pan-y overflow-visible"
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                onPointerDown={handlePointer}
                onPointerMove={handlePointer}
                onPointerLeave={() => setActiveIndex(null)}
                aria-hidden="true"
              >
                <line
                  x1={PAD}
                  x2={W - PAD}
                  y1={H - PAD}
                  y2={H - PAD}
                  stroke="#2f2f34"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                {points.map((bar, index) => (
                  <motion.rect
                    key={`${bar.label}-${index}`}
                    x={bar.x}
                    width={bar.width}
                    initial={{ y: H - PAD, height: 0 }}
                    animate={
                      isInView
                        ? { y: bar.y, height: bar.height }
                        : { y: H - PAD, height: 0 }
                    }
                    transition={{
                      duration: 0.45,
                      ease: EASE,
                      delay: index * 0.045,
                    }}
                    fill={accent}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                  />
                ))}
              </svg>
            )}
          </div>
        </>
      )}
    </article>
  );
}
