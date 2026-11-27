import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, type MotionValue } from 'motion/react';
import type { RefObject } from 'react';
import type { LayerId, LayerOffset, SparkyConfig } from './config';
import { DEFAULT_CONFIG, BROW, EYELID, SCLERA_CENTERS, SPRITE_HEIGHT, SPRITE_WIDTH } from './config';
import SparkyDebugPanel from './SparkyDebugPanel';
import { DEV_TOOLS } from '../../../lib/dev-tools';
import { pupilOffset } from './tracking';

const PUPIL_SIZE = 43;
const SCLERA_SIZE = 72;
const DEG = Math.PI / 180;

const OUTLINE: Record<LayerId, string> = {
  body: 'rgba(205,241,41,0.55)',
  pupilLeft: 'rgba(0,229,255,0.9)',
  pupilRight: 'rgba(0,229,255,0.9)',
  eyelid: 'rgba(255,45,111,0.9)',
  brow: 'rgba(255,159,64,0.95)',
};

export default function SparkyEyes({
  debug = false,
  size = 132,
  config: configProp,
}: {
  debug?: boolean;
  size?: number;
  config?: SparkyConfig;
}) {
  const [config, setConfig] = useState<SparkyConfig>(() => configProp ?? DEFAULT_CONFIG);
  const [selected, setSelected] = useState<LayerId>('body');
  const [outlines, setOutlines] = useState(false);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [intro, setIntro] = useState(reduced);

  const configRef = useRef(config);
  configRef.current = config;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const leftScleraRef = useRef<HTMLImageElement>(null);
  const rightScleraRef = useRef<HTMLImageElement>(null);

  const leftX = useMotionValue(0);
  const leftY = useMotionValue(0);
  const rightX = useMotionValue(0);
  const rightY = useMotionValue(0);
  // Latest computed gaze, sampled by the stepped loop below (animation
  // "on twos": 12 fps holds, Spider-Verse-style stepped motion).
  const latestRef = useRef({
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
  });

  // Global cursor tracking. Only motion values are written here, so a mouse
  // frame never re-renders React. The sclera rect gives the real screen
  // centre/scale; the offset is un-rotated into the sclera's local axes
  // because the pupil is parented to the sclera.
  useEffect(() => {
    const aim = (
      targetFor: (cx: number, cy: number) => [number, number],
      commit = false,
    ) => {
      const leftSclera = leftScleraRef.current;
      const rightSclera = rightScleraRef.current;
      if (!leftSclera || !rightSclera) return;

      const cfg = configRef.current;
      const body = cfg.initialOffsets.body;
      const stageRotate = cfg.stageOffset.rotate;
      const bodyRotate = body.rotate;
      const leftLayer = cfg.initialOffsets.pupilLeft;
      const rightLayer = cfg.initialOffsets.pupilRight;

      const measure = (
        element: HTMLImageElement,
        layerRotate: number,
      ): { x: number; y: number } => {
        const rect = element.getBoundingClientRect();
        const scale = rect.width / SCLERA_SIZE;
        if (!Number.isFinite(scale) || scale <= 0) return { x: 0, y: 0 };
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const [tx, ty] = targetFor(cx, cy);
        const screen = pupilOffset(cx, cy, tx, ty, cfg.maxRadius * scale);
        const radians = -(stageRotate + bodyRotate + layerRotate) * DEG;
        return {
          x: (screen.x * Math.cos(radians) - screen.y * Math.sin(radians)) / scale,
          y: (screen.x * Math.sin(radians) + screen.y * Math.cos(radians)) / scale,
        };
      };

      const l = measure(leftSclera, leftLayer.rotate);
      const r = measure(rightSclera, rightLayer.rotate);
      latestRef.current = { left: l, right: r };
      // Commit immediately so the idle gaze never shows a centred frame while
      // the 12 fps loop waits for its first tick.
      if (commit) {
        leftX.set(Math.round(l.x));
        leftY.set(Math.round(l.y));
        rightX.set(Math.round(r.x));
        rightY.set(Math.round(r.y));
      }
    };

    // No pointer event yet: look up-right at full radius instead of staring
    // dead centre. Re-run on the next frame in case layout/fonts shift.
    const idleAim = () => aim((cx, cy) => [cx + 1e4, cy - 1e4], true);
    idleAim();
    const raf = window.requestAnimationFrame(idleAim);

    const onMove = (event: PointerEvent) => {
      if (pausedRef.current) return;
      aim(() => [event.clientX, event.clientY]);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  // Stepped gaze: sample the latest direction at 12 fps and snap the pupils
  // to whole pixels. No spring smoothing — the hold-and-snap cadence is the
  // "on twos" look.
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const STEP_MS = 1000 / 12;
    const tick = (now: number) => {
      raf = window.requestAnimationFrame(tick);
      if (now - last < STEP_MS) return;
      last = now;
      const latest = latestRef.current;
      leftX.set(Math.round(latest.left.x));
      leftY.set(Math.round(latest.left.y));
      rightX.set(Math.round(latest.right.x));
      rightY.set(Math.round(latest.right.y));
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [leftX, leftY, rightX, rightY]);

  // Paused = resting pose. The next pointer move resumes when unpaused.
  useEffect(() => {
    if (!paused) return;
    latestRef.current = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
    leftX.set(0);
    leftY.set(0);
    rightX.set(0);
    rightY.set(0);
  }, [paused, leftX, leftY, rightX, rightY]);

  // Enter after the map splash + top-chrome entrance is done, so the user
  // reads one motion sequence instead of competing animations.
  useEffect(() => {
    if (reduced) return;
    const start = () => setIntro(true);
    if ((window as { __icdMapReady?: boolean }).__icdMapReady) {
      const timer = window.setTimeout(start, 480);
      return () => window.clearTimeout(timer);
    }
    window.addEventListener('icd:splash-done', start, { once: true });
    const fallback = window.setTimeout(start, 2500);
    return () => {
      window.removeEventListener('icd:splash-done', start);
      window.clearTimeout(fallback);
    };
  }, [reduced]);

  // Arrow-key nudge for the selected layer (1px).
  useEffect(() => {
    if (!debug) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, button, [contenteditable="true"]')) return;
      const delta = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }[event.key];
      if (!delta) return;
      event.preventDefault();
      setConfig((current) => ({
        ...current,
        initialOffsets: {
          ...current.initialOffsets,
          [selected]: {
            ...current.initialOffsets[selected],
            x: current.initialOffsets[selected].x + delta[0],
            y: current.initialOffsets[selected].y + delta[1],
          },
        },
      }));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [debug, selected]);

  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('[sparky] copy config failed', error);
    }
  };

  const body = config.initialOffsets.body;
  const leftPupil = config.initialOffsets.pupilLeft;
  const rightPupil = config.initialOffsets.pupilRight;
  const eyelid = config.initialOffsets.eyelid;
  const brow = config.initialOffsets.brow;
  const maxRadius = config.maxRadius;

  const zIndex = (id: LayerId) => config.zIndexOrder.indexOf(id) + 1;
  const dashed = (id: LayerId) => (outlines ? `1px dashed ${OUTLINE[id]}` : undefined);

  // Body is the sprite root: its offset/rotation/scale applies to every layer.
  const rootTransform = `translate(${body.x}px, ${body.y}px) rotate(${body.rotate}deg) scale(${body.scale})`;
  const layerWrapper = (id: LayerId, offset: LayerOffset) => ({
    position: 'absolute' as const,
    inset: 0,
    zIndex: zIndex(id),
    opacity: offset.visible ? 1 : 0,
    transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rotate}deg) scale(${offset.scale})`,
    transformOrigin: 'center',
    pointerEvents: 'none' as const,
  });

  const eye = (
    id: 'pupilLeft' | 'pupilRight',
    offset: LayerOffset,
    center: { x: number; y: number },
    springX: MotionValue<number>,
    springY: MotionValue<number>,
    scleraRef: RefObject<HTMLImageElement | null>,
  ) => (
    <div
      style={{
        position: 'absolute',
        left: center.x + offset.x,
        top: center.y + offset.y,
        zIndex: zIndex(id),
        opacity: offset.visible ? 1 : 0,
        transform: `translate(-50%, -50%) rotate(${offset.rotate}deg) scale(${offset.scale})`,
        transformOrigin: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* sclera owns the rotation/scale; the pupil is parented to it */}
      <img
        ref={scleraRef}
        src="/map/sparky/sclera.png"
        alt=""
        draggable={false}
        width={SCLERA_SIZE}
        height={SCLERA_SIZE}
        className="block max-w-none"
        style={{ outline: dashed(id) }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.img
          src="/map/sparky/pupil.png"
          alt=""
          draggable={false}
          width={PUPIL_SIZE}
          height={PUPIL_SIZE}
          style={{ x: springX, y: springY }}
          className="block max-w-none"
        />
      </div>
      {outlines && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: maxRadius * 2,
            height: maxRadius * 2,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '1px dashed rgba(0,229,255,0.9)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );

  return (
    <>
      <motion.div
        initial={false}
        animate={intro ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{
          duration: reduced ? 0 : 0.62,
          ease: [0.65, 0, 0.35, 1],
          delay: reduced ? 0 : 0.12,
        }}
        className="pointer-events-none relative mb-1 select-none"
        aria-hidden="true"
      >
        <div
          style={{
            transform: `translate(${config.stageOffset.x}px, ${config.stageOffset.y}px) rotate(${config.stageOffset.rotate}deg)`,
            transformOrigin: 'center',
            zIndex: config.stageZIndex,
          }}
        >
        <div
          className="relative"
          style={{ width: size, height: (size * SPRITE_HEIGHT) / SPRITE_WIDTH }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: rootTransform,
              transformOrigin: 'center',
            }}
          >
            <img
              src="/map/sparky/body.png"
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full select-none"
              style={{ zIndex: zIndex('body'), outline: dashed('body') }}
            />

            {eye(
              'pupilLeft',
              leftPupil,
              SCLERA_CENTERS.left,
              leftX,
              leftY,
              leftScleraRef,
            )}
            {eye(
              'pupilRight',
              rightPupil,
              SCLERA_CENTERS.right,
              rightX,
              rightY,
              rightScleraRef,
            )}

            <div style={layerWrapper('eyelid', eyelid)}>
              <img
                src="/map/sparky/eyelid-right.png"
                alt=""
                draggable={false}
                width={74}
                height={67}
                className="absolute max-w-none"
                style={{
                  left: EYELID.x,
                  top: EYELID.y,
                  transform: 'translate(-50%, -50%)',
                  outline: dashed('eyelid'),
                }}
              />
            </div>

            <div style={layerWrapper('brow', brow)}>
              <img
                src="/map/sparky/eyebrow-right.png"
                alt=""
                draggable={false}
                width={53}
                height={24}
                className="absolute max-w-none"
                style={{
                  left: BROW.x,
                  top: BROW.y,
                  transform: 'translate(-50%, -50%)',
                  outline: dashed('brow'),
                }}
              />
            </div>
          </div>
        </div>
        </div>
      </motion.div>

      {DEV_TOOLS &&
        debug &&
        typeof document !== 'undefined' &&
        createPortal(
          <SparkyDebugPanel
            config={config}
            setConfig={setConfig}
            selected={selected}
            onSelect={setSelected}
            outlines={outlines}
            setOutlines={setOutlines}
            paused={paused}
            setPaused={setPaused}
            onCopy={copyConfig}
            copied={copied}
          />,
          document.body,
        )}
    </>
  );
}
