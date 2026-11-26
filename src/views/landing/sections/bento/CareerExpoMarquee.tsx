'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import LogoBox from './LogoBox';
import type { LogoItem } from './logos';

interface CareerExpoMarqueeProps {
  columns: LogoItem[][];
}

/**
 * Scroll-driven vertical logo marquee. Each column moves at a different speed
 * as the card travels through the viewport; it is paused for users who prefer
 * reduced motion.
 */
export default function CareerExpoMarquee({ columns }: CareerExpoMarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      root.style.setProperty('--marquee-progress', '0.5');
      return;
    }

    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const progress = Math.min(1, Math.max(0, (viewport - rect.top) / (viewport + rect.height)));
      root.style.setProperty('--marquee-progress', progress.toFixed(4));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="mx-auto grid h-full w-full max-w-[210px] grid-cols-3 gap-2 overflow-hidden"
      style={{ '--marquee-progress': 0.5 } as CSSProperties}
      aria-hidden="true"
    >
      {columns.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="flex flex-col gap-2 will-change-transform"
          style={{
            transform: `translate3d(0, calc(-1 * var(--marquee-progress) * ${(columnIndex + 1) * 180}px - ${columnIndex * 48}px), 0)`,
          }}
        >
          {[...column, ...column].map((logo, index) => (
            <LogoBox
              key={`${logo.name}-${index}`}
              src={logo.src}
              alt={logo.name}
              className="aspect-square w-full shrink-0"
              imgClassName="max-h-[70%]"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
