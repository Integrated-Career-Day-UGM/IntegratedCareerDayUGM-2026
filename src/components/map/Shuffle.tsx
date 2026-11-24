import { useEffect, useState } from 'react';
import './Shuffle.css';

type ShuffleProps = {
  text: string;
  effect?: 'slide' | 'fade';
  shuffleDirection?: 'left' | 'right';
  duration?: number;
  animationMode?: 'evenodd' | 'all';
  shuffleTimes?: number;
  ease?: string;
  stagger?: number;
  threshold?: number;
  triggerOnce?: boolean;
  triggerOnHover?: boolean;
  hoverRadius?: number;
  motionBlur?: boolean;
  respectReducedMotion?: boolean;
  className?: string;
};

/**
 * Lightweight text shuffle: each glyph slides in from alternating sides with
 * a stagger. API mirrors the ReactBits Shuffle props used in the design brief;
 * only slide/evenodd/reduced-motion are materialised here.
 */
export default function Shuffle({
  text,
  effect = 'slide',
  shuffleDirection = 'right',
  duration = 0.35,
  animationMode = 'evenodd',
  stagger = 0.03,
  triggerOnce = true,
  triggerOnHover = false,
  respectReducedMotion = true,
  className = '',
}: ShuffleProps) {
  const [run, setRun] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (!respectReducedMotion) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [respectReducedMotion]);

  if (reduce) {
    return <span className={className}>{text}</span>;
  }

  const chars = [...text];
  return (
    <span
      className={`shuffle ${className}`}
      aria-label={text}
      onPointerEnter={() => {
        if (triggerOnHover && !(triggerOnce && run > 0)) setRun((value) => value + 1);
      }}
    >
      {chars.map((char, index) => {
        const alternate = animationMode === 'evenodd' && index % 2 === 1;
        const direction = alternate
          ? shuffleDirection === 'right'
            ? 'left'
            : 'right'
          : shuffleDirection;
        return (
          <span key={`${run}-${index}`} className="shuffle-char" aria-hidden="true">
            <span
              className={`shuffle-char-inner shuffle-${effect} shuffle-${direction}`}
              style={{
                animationDuration: `${duration}s`,
                animationDelay: `${index * stagger}s`,
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          </span>
        );
      })}
    </span>
  );
}
