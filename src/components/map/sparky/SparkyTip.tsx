import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '../../../lib/utils/cn';
import {
  SPARKY_BODY_ROTATE,
  placementVars,
  randomSparkySkew,
} from '../../../lib/map/sparky-tips';

export type SparkyTipMessage = {
  text: string;
  /** Dark bubble = white text; light bubble = black text. */
  variant?: 'dark' | 'light';
};

type SparkyTipProps = {
  /** Tuner + config key. Parts become `sparky-tip-<slot>[-dialog|-name|-body|-text]`. */
  slot: string;
  /** One message = static; several = crossfaded on a timer. */
  messages: SparkyTipMessage[];
  intervalMs?: number;
  /** Show the white "Sparky" name plate. */
  name?: boolean;
  className?: string;
};

/**
 * Sparky's map tip: character + speech bubble + name plate composed as one
 * unit, per the source art board. The group moves everything; each part can be
 * nudged on its own from the dev layout panel.
 */
export default function SparkyTip({
  slot,
  messages,
  intervalMs = 5000,
  name = true,
  className,
}: SparkyTipProps) {
  const [index, setIndex] = useState(0);
  // One random speed + phase + strength per mounted bubble.
  const [skew] = useState(randomSparkySkew);
  const messageKey = messages.map((item) => item.text).join('\u0001');

  useEffect(() => {
    if (messages.length < 2) return;
    const advance = () =>
      setIndex((current) => (current + 1) % messages.length);
    let timer = window.setInterval(advance, intervalMs);
    // Don't churn timers on a hidden tab; resume on return.
    const onVisibility = () => {
      window.clearInterval(timer);
      if (!document.hidden) timer = window.setInterval(advance, intervalMs);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageKey, intervalMs]);

  const message = messages[index % messages.length] ?? messages[0];
  const light = message?.variant === 'light';

  return (
    <div
      data-layout-tune={`sparky-tip-${slot}`}
      className={cn(
        'sparky-tip-part pointer-events-none relative aspect-[720/577] w-[210px] origin-top-left select-none md:w-[260px]',
        className,
      )}
      style={placementVars(`sparky-tip-${slot}`)}
    >
      <div
        data-layout-tune={`sparky-tip-${slot}-dialog`}
        className="sparky-tip-part absolute top-0 left-0 w-full"
        style={{ aspectRatio: '1996 / 814', ...placementVars(`sparky-tip-${slot}-dialog`) }}
      >
        <img
          src={light ? '/sparky/bubble-light.png' : '/sparky/bubble-dark.png'}
          alt=""
          draggable={false}
          className="sparky-dialog-art absolute inset-0 size-full max-w-none"
          style={{
            animationDelay: `${skew.delay}s`,
            animationDuration: `${skew.duration}s`,
            '--skew-amp': String(skew.amp),
          } as CSSProperties}
        />
        <p
          key={index}
          data-layout-tune={`sparky-tip-${slot}-text`}
          className={cn(
            'sparky-tip-part sparky-tip-text absolute inset-x-[6%] top-[9%] flex h-[36%] items-center text-[0.6875rem] leading-tight font-semibold md:text-[0.75rem]',
            light ? 'text-black' : 'text-white',
          )}
          style={placementVars(`sparky-tip-${slot}-text`)}
        >
          {message?.text}
        </p>
      </div>

      {name && (
        <div
          data-layout-tune={`sparky-tip-${slot}-name`}
          className="sparky-tip-part absolute bottom-[16%] left-0 w-[27%]"
          style={{
            aspectRatio: '722 / 484',
            ...placementVars(`sparky-tip-${slot}-name`),
          }}
        >
          <img
            src="/sparky/name-plate.png"
            alt=""
            draggable={false}
            className="absolute inset-0 size-full max-w-none"
          />
          <span className="absolute inset-x-[10%] top-[26%] font-heading text-[0.6875rem] leading-none font-bold text-black md:text-[0.75rem]">
            Sparky
          </span>
        </div>
      )}

      <div
        data-layout-tune={`sparky-tip-${slot}-body`}
        className="sparky-tip-part absolute right-0 bottom-0 w-[34%]"
        style={placementVars(`sparky-tip-${slot}-body`)}
      >
        {/* Baked tilt sits inside the tunable wrapper so the panel's rotate
            control composes with it instead of replacing it. */}
        <img
          src="/sparky/body.webp"
          alt=""
          draggable={false}
          className="w-full max-w-none"
          style={{ rotate: `${SPARKY_BODY_ROTATE}deg` }}
        />
      </div>

      {messages.length > 1 && (
        <span className="sr-only">
          {messages.map((item) => item.text).join('. ')}
        </span>
      )}
    </div>
  );
}
