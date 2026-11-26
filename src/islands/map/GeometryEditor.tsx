import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BOOTH_SHAPES,
  PLAN_ANNOTATIONS,
  PLAN_LABELS,
  PLAN_SPRITES,
} from '../../lib/map/floorplan';
import WalkIn2FEditor from './WalkIn2FEditor';

/**
 * DEV-only geometry editor. A flat 818×820 frame (the same coordinate space
 * as FloorPlanOverlay) with draggable/rotatable boxes and SVG fixtures.
 * It does not mutate the map — it records exact frame coordinates so the
 * overlay can be updated one-to-one.
 *
 * Export includes: booth wrapper boxes (+ inner dims/rotation), banners,
 * static sprites (toilet, mushola, panggung, horseshoe, seats, doors),
 * polygon annotations, and the hull+pillar group transform.
 */

type Kind = 'booth' | 'label' | 'sprite';

type GeomItem = {
  kind: Kind;
  id: string;
  label: string;
  left: number;
  top: number;
  w: number;
  h: number;
  innerW: number;
  innerH: number;
  rotate: number;
  color?: string;
  src?: string;
};

const INITIAL_LABELS: GeomItem[] = [
  { kind: 'label', id: 'photo-wall', label: 'Photo Wall', left: 260.8, top: 16.9, w: 80.545, h: 102.326, innerW: 107.725, innerH: 23.819, rotate: 55.58, color: '#0e7490' },
  { kind: 'label', id: 'photobooth', label: 'Photobooth', left: 175.1, top: 163.8, w: 102.342, h: 80.516, innerW: 107.725, innerH: 23.819, rotate: -34.4, color: '#ff2d6f' },
  { kind: 'label', id: 'entrance', label: 'Entrance', left: 31.7, top: 339.7, w: 47.943, h: 90.191, innerW: 87.907, innerH: 21.433, rotate: -71.71, color: '#0fae4a' },
  { kind: 'label', id: 'registration', label: 'Registration', left: 42.1, top: 501.7, w: 56.562, h: 116.265, innerW: 115.368, innerH: 21.433, rotate: -70.71, color: '#e5484d' },
  { kind: 'label', id: 'panggung', label: 'Panggung', left: 508.8, top: 214.8, w: 83.646, h: 56.567, innerW: 86.753, innerH: 16.266, rotate: 29.24, color: '#8f8f8f' },
  ...PLAN_LABELS.map((label) => ({
    kind: 'label' as const,
    id: label.id,
    label: label.label,
    left: label.left,
    top: label.top,
    w: label.w,
    h: label.h,
    innerW: label.w,
    innerH: label.h,
    rotate: label.rotate,
    color: label.color,
  })),
];

const INITIAL_BOOTHS: GeomItem[] = BOOTH_SHAPES.map((s) => ({
  kind: 'booth',
  id: s.id,
  label: s.code,
  left: s.left,
  top: s.top,
  w: s.w,
  h: s.h,
  rotate: s.rotate,
  innerW: s.innerW,
  innerH: s.innerH,
  color: s.bg,
}));

const INITIAL_SPRITES: GeomItem[] = PLAN_SPRITES.map((s) => ({
  kind: 'sprite',
  id: s.id,
  label: s.label,
  left: s.left,
  top: s.top,
  w: s.w,
  h: s.h,
  innerW: s.w,
  innerH: s.h,
  rotate: s.rotate,
  src: s.src,
}));

const INITIAL_ITEMS: GeomItem[] = [
  ...INITIAL_SPRITES,
  ...INITIAL_LABELS,
  ...INITIAL_BOOTHS,
];

type Annotation = {
  id: string;
  name: string;
  color: string;
  points: [number, number][];
};

const INITIAL_ANNOTATIONS: Annotation[] = PLAN_ANNOTATIONS.map((a) => ({
  ...a,
  points: a.points.map((p) => [...p] as [number, number]),
}));

const FRAME_W = 818;
const FRAME_H = 820;
const EDITOR_SCALE = 0.65;

type ItemSel = { kind: Kind; id: string };

const round = (n: number) => Math.round(n * 10) / 10;

type DragTarget = {
  kind: Kind;
  id: string;
  left: number;
  top: number;
  w: number;
  h: number;
  innerW: number;
  innerH: number;
};

export default function GeometryEditor() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'expo' | 'walkin'>('expo');
  const [items, setItems] = useState<GeomItem[]>(INITIAL_ITEMS);
  const [hull, setHull] = useState({
    tx: 242.5,
    ty: -76.2,
    scale: 0.1909,
    rotate: 18.3,
  });
  const hullRef = useRef(hull);
  const [selection, setSelection] = useState<ItemSel[]>([]);
  const [hullSelected, setHullSelected] = useState(false);
  const [json, setJson] = useState('');
  const [annotations, setAnnotations] = useState<Annotation[]>(INITIAL_ANNOTATIONS);
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<[number, number][]>([]);
  const [annotationName, setAnnotationName] = useState('Toilet');
  const [annotationColor, setAnnotationColor] = useState('#f0c71d');
  const frameRef = useRef<HTMLDivElement>(null);

  const drag = useRef<{
    kind: 'move' | 'resize';
    hull: boolean;
    targets: DragTarget[];
    startX: number;
    startY: number;
    tx: number;
    ty: number;
  } | null>(null);

  /**
   * Parent every component to the hull: when the hull transform changes,
   * apply the same similarity delta to all item centers, sizes and rotations.
   * Individual item drags still work on top of the new frame positions.
   */
  const moveHull = useCallback((next: typeof hull) => {
    const prev = hullRef.current;
    if (
      prev.tx === next.tx &&
      prev.ty === next.ty &&
      prev.scale === next.scale &&
      prev.rotate === next.rotate
    ) {
      return;
    }
    const scale = next.scale / prev.scale;
    const aIn = (-prev.rotate * Math.PI) / 180;
    const aOut = (next.rotate * Math.PI) / 180;
    const cosIn = Math.cos(aIn);
    const sinIn = Math.sin(aIn);
    const cosOut = Math.cos(aOut);
    const sinOut = Math.sin(aOut);

    setItems((list) =>
      list.map((item) => {
        const cx = item.left + item.w / 2;
        const cy = item.top + item.h / 2;
        const px = (cx - prev.tx) / prev.scale;
        const py = (cy - prev.ty) / prev.scale;
        const lx = px * cosIn - py * sinIn;
        const ly = px * sinIn + py * cosIn;
        const nx = lx * cosOut - ly * sinOut;
        const ny = lx * sinOut + ly * cosOut;
        const ncx = next.tx + next.scale * nx;
        const ncy = next.ty + next.scale * ny;
        const w = item.w * scale;
        const h = item.h * scale;
        return {
          ...item,
          left: round(ncx - w / 2),
          top: round(ncy - h / 2),
          w: round(w),
          h: round(h),
          innerW: round(item.innerW * scale),
          innerH: round(item.innerH * scale),
          rotate: round(item.rotate + next.rotate - prev.rotate),
        };
      }),
    );

    setAnnotations((list) =>
      list.map((annotation) => ({
        ...annotation,
        points: annotation.points.map(([x, y]) => {
          const px = (x - prev.tx) / prev.scale;
          const py = (y - prev.ty) / prev.scale;
          const lx = px * cosIn - py * sinIn;
          const ly = px * sinIn + py * cosIn;
          const nx = lx * cosOut - ly * sinOut;
          const ny = lx * sinOut + ly * cosOut;
          return [round(next.tx + next.scale * nx), round(next.ty + next.scale * ny)] as [
            number,
            number,
          ];
        }),
      })),
    );

    hullRef.current = next;
    setHull(next);
  }, []);

  const isSelected = (kind: Kind, id: string) =>
    selection.some((s) => s.kind === kind && s.id === id);

  const selected = useMemo(() => {
    if (selection.length !== 1) return null;
    const s = selection[0];
    return items.find((i) => i.kind === s.kind && i.id === s.id) ?? null;
  }, [selection, items]);

  const sprites = useMemo(() => items.filter((i) => i.kind === 'sprite'), [items]);
  const labels = useMemo(() => items.filter((i) => i.kind === 'label'), [items]);

  const startDrag = (
    e: React.PointerEvent,
    kind: 'move' | 'resize',
    target: 'hull' | Kind,
    id?: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (target === 'hull') {
      setHullSelected(true);
      setSelection([]);
      drag.current = {
        kind: 'move',
        hull: true,
        targets: [],
        startX: e.clientX,
        startY: e.clientY,
        tx: hullRef.current.tx,
        ty: hullRef.current.ty,
      };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }
    const key = { kind: target, id: id! };
    const already = isSelected(target, id!);
    let next = selection;
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      next = already
        ? selection.filter((s) => !(s.kind === target && s.id === id))
        : [...selection, key];
    } else if (!already) {
      next = [key];
    }
    setSelection(next);
    setHullSelected(false);

    const keys = kind === 'resize' ? [key] : next;
    const targets = keys.flatMap((k) => {
      const item = items.find((i) => i.kind === k.kind && i.id === k.id);
      return item
        ? [
            {
              kind: k.kind,
              id: k.id,
              left: item.left,
              top: item.top,
              w: item.w,
              h: item.h,
              innerW: item.innerW,
              innerH: item.innerH,
            },
          ]
        : [];
    });
    drag.current = {
      kind,
      hull: false,
      targets,
      startX: e.clientX,
      startY: e.clientY,
      tx: 0,
      ty: 0,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    if (!open) return;
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = (e.clientX - d.startX) / EDITOR_SCALE;
      const dy = (e.clientY - d.startY) / EDITOR_SCALE;
      if (d.hull) {
        moveHull({
          ...hullRef.current,
          tx: round(d.tx + dx),
          ty: round(d.ty + dy),
        });
        return;
      }
      if (d.kind === 'move') {
        setItems((list) =>
          list.map((item) => {
            const t = d.targets.find(
              (x) => x.kind === item.kind && x.id === item.id,
            );
            return t
              ? { ...item, left: round(t.left + dx), top: round(t.top + dy) }
              : item;
          }),
        );
        return;
      }
      const t = d.targets[0];
      if (!t) return;
      const w = Math.max(8, round(t.w + dx));
      const h = Math.max(8, round(t.h + dy));
      const sx = w / t.w;
      const sy = h / t.h;
      setItems((list) =>
        list.map((item) =>
          item.kind === t.kind && item.id === t.id
            ? {
                ...item,
                w,
                h,
                innerW: Math.max(1, round(t.innerW * sx)),
                innerH: Math.max(1, round(t.innerH * sy)),
              }
            : item,
        ),
      );
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [open, moveHull]);

  const exportJson = () => {
    const pick = (kind: Kind) =>
      items
        .filter((i) => i.kind === kind)
        .map(({ id, left, top, w, h, rotate, innerW, innerH }) => ({
          id,
          left,
          top,
          w,
          h,
          rotate,
          innerW,
          innerH,
        }));
    const payload = {
      frame: { width: FRAME_W, height: FRAME_H },
      hull,
      booths: pick('booth'),
      labels: pick('label'),
      sprites: pick('sprite'),
      annotations,
    };
    const text = JSON.stringify(payload, null, 2);
    setJson(text);
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  const patchSelected = (patch: Record<string, number>) => {
    if (selection.length !== 1) return;
    const s = selection[0];
    setItems((list) =>
      list.map((item) => {
        if (item.kind !== s.kind || item.id !== s.id) return item;
        const next = { ...item, ...patch };
        if (item.kind === 'sprite') {
          if ('w' in patch) next.innerW = patch.w;
          if ('h' in patch) next.innerH = patch.h;
        }
        return next;
      }),
    );
  };

  const addAnnotationPoint = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawing || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = round((e.clientX - rect.left) / EDITOR_SCALE);
    const y = round((e.clientY - rect.top) / EDITOR_SCALE);
    setDraft((p) => [...p, [x, y]]);
  };

  const finishAnnotation = () => {
    if (draft.length < 3) return;
    setAnnotations((list) => [
      ...list,
      {
        id: `anno-${Date.now()}`,
        name: annotationName.trim() || 'Annotation',
        color: annotationColor,
        points: draft,
      },
    ]);
    setDraft([]);
    setDrawing(false);
  };

  const selectItem = (kind: Kind, id: string) => {
    setSelection([{ kind, id }]);
    setHullSelected(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[90] border border-[#34343a] bg-[#0c0c0f] px-3 py-2 font-mono text-[10px] text-white shadow-lg"
      >
        GEOM
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-full w-full max-w-5xl flex-col border border-[#34343a] bg-[#0c0c0f] text-white">
        <div className="flex items-center justify-between border-b border-[#34343a] px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setTab('expo')}
                className={`border px-2 py-1 text-[10px] ${
                  tab === 'expo'
                    ? 'border-[#ff2d6f] bg-[#ff2d6f] text-white'
                    : 'border-[#34343a] text-[#8f8f8f]'
                }`}
              >
                Career Expo
              </button>
              <button
                type="button"
                onClick={() => setTab('walkin')}
                className={`border px-2 py-1 text-[10px] ${
                  tab === 'walkin'
                    ? 'border-[#ff2d6f] bg-[#ff2d6f] text-white'
                    : 'border-[#34343a] text-[#8f8f8f]'
                }`}
              >
                Walk-in 2F
              </button>
            </div>
            <div className="font-mono text-[10px] text-[#8f8f8f]">
              {tab === 'expo'
                ? 'drag · rotate · shift-click group · scale handle'
                : 'position the second-floor hull and room grid'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="border border-[#34343a] px-2 py-1 text-[10px]"
          >
            Close
          </button>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-auto ${
            tab === 'expo' ? 'flex' : 'hidden'
          }`}
        >
          <div className="flex-1 overflow-auto p-4">
            <div
              className="relative"
              style={{
                width: FRAME_W * EDITOR_SCALE,
                height: FRAME_H * EDITOR_SCALE,
                background: '#17171a',
                outline: '1px solid #34343a',
              }}
            >
              <div
                ref={frameRef}
                style={{
                  width: FRAME_W,
                  height: FRAME_H,
                  transform: `scale(${EDITOR_SCALE})`,
                  transformOrigin: '0 0',
                  position: 'relative',
                  backgroundColor: '#e8e4da',
                  backgroundImage:
                    'linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)',
                  backgroundSize: '50px 50px',
                }}
              >
                {/* hull + pillars */}
                <div
                  data-geom-hull=""
                  onPointerDown={(e) => startDrag(e, 'move', 'hull')}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 2954,
                    height: 4301,
                    transform: `translate(${hull.tx}px, ${hull.ty}px) rotate(${hull.rotate}deg) scale(${hull.scale})`,
                    transformOrigin: '0 0',
                    cursor: 'move',
                    outline: hullSelected ? '2px solid #ff2d6f' : undefined,
                    zIndex: 1,
                  }}
                >
                  <img
                    src="/maps/assets/hall-pillars.svg"
                    alt=""
                    className="block size-full max-w-none"
                    draggable={false}
                  />
                </div>

                {items.map((item) => {
                  const active = isSelected(item.kind, item.id);
                  const darkInk =
                    item.kind === 'booth' &&
                    (item.id.startsWith('d') || item.id.startsWith('e'));
                  return (
                    <div
                      key={`${item.kind}-${item.id}`}
                      data-geom-item={item.id}
                      data-geom-kind={item.kind}
                      onPointerDown={(e) =>
                        startDrag(e, 'move', item.kind, item.id)
                      }
                      style={{
                        position: 'absolute',
                        left: item.left,
                        top: item.top,
                        width: item.w,
                        height: item.h,
                        cursor: 'move',
                        outline: active ? '1px dashed #ff2d6f' : undefined,
                        background: active ? '#ff2d6f14' : undefined,
                        zIndex:
                          item.kind === 'sprite' ? 2 : item.kind === 'label' ? 3 : 5,
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          width: item.innerW,
                          height: item.innerH,
                          transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`,
                          background: item.src ? undefined : item.color,
                          border: item.src ? undefined : '1px solid #ffffff',
                          color: darkInk ? '#111' : '#fff',
                          fontSize: item.kind === 'booth' ? 10 : 8,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.src ? (
                          <img
                            alt=""
                            src={item.src}
                            className="block size-full max-w-none"
                            draggable={false}
                          />
                        ) : (
                          item.label
                        )}
                      </div>
                      {active && selection.length === 1 && (
                        <div
                          onPointerDown={(e) =>
                            startDrag(e, 'resize', item.kind, item.id)
                          }
                          style={{
                            position: 'absolute',
                            right: -5,
                            bottom: -5,
                            width: 10,
                            height: 10,
                            background: '#ff2d6f',
                            cursor: 'nwse-resize',
                            zIndex: 20,
                          }}
                        />
                      )}
                    </div>
                  );
                })}

                {/* polygon annotations */}
                <svg
                  viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
                  className="pointer-events-none absolute inset-0 z-20"
                >
                  {annotations.map((a) => {
                    const cx =
                      a.points.reduce((s, p) => s + p[0], 0) / a.points.length;
                    const cy =
                      a.points.reduce((s, p) => s + p[1], 0) / a.points.length;
                    return (
                      <g key={a.id}>
                        <polygon
                          points={a.points.map((p) => p.join(',')).join(' ')}
                          fill={`${a.color}44`}
                          stroke={a.color}
                          strokeWidth={2}
                        />
                        <text
                          x={cx}
                          y={cy}
                          fill="#111"
                          fontSize={10}
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {a.name}
                        </text>
                      </g>
                    );
                  })}
                  {draft.length > 0 && (
                    <polygon
                      points={draft.map((p) => p.join(',')).join(' ')}
                      fill="none"
                      stroke={annotationColor}
                      strokeWidth={2}
                      strokeDasharray="4 3"
                    />
                  )}
                  {draft.map(([x, y], i) => (
                    <circle
                      key={`draft-${i}`}
                      cx={x}
                      cy={y}
                      r={3}
                      fill={annotationColor}
                    />
                  ))}
                </svg>

                {drawing && (
                  <div
                    className="absolute inset-0 z-40 cursor-crosshair"
                    onClick={addAnnotationPoint}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="w-64 shrink-0 overflow-auto border-l border-[#34343a] p-3 font-mono text-[10px]">
            <div className="mb-2 text-[#8f8f8f]">Selection</div>
            <div className="mb-2 text-[9px] text-[#6b7280]">
              Shift/⌘-click to multi-select; drag any selected to move the group.
            </div>
            {hullSelected ? (
              <div className="space-y-2">
                <div className="text-[9px] text-[#6b7280]">
                  Moving the hull moves every booth, label and SVG with it.
                </div>
                {(['tx', 'ty', 'scale', 'rotate'] as const).map((key) => (
                  <label key={key} className="flex items-center justify-between gap-2">
                    <span>{key}</span>
                    <input
                      type="number"
                      step={key === 'scale' ? 0.001 : 0.1}
                      value={hull[key]}
                      onChange={(e) =>
                        moveHull({
                          ...hullRef.current,
                          [key]: Number(e.target.value),
                        })
                      }
                      className="w-24 border border-[#34343a] bg-[#141416] px-1 py-0.5 text-right text-white"
                    />
                  </label>
                ))}
              </div>
            ) : selected ? (
              <div className="space-y-2">
                {(selected.kind === 'sprite'
                  ? (['left', 'top', 'w', 'h', 'rotate'] as const)
                  : (['left', 'top', 'w', 'h', 'rotate', 'innerW', 'innerH'] as const)
                ).map((key) => (
                  <label key={key} className="flex items-center justify-between gap-2">
                    <span>{key}</span>
                    <input
                      type="number"
                      step={0.1}
                      value={selected[key]}
                      onChange={(e) =>
                        patchSelected({ [key]: Number(e.target.value) })
                      }
                      className="w-24 border border-[#34343a] bg-[#141416] px-1 py-0.5 text-right text-white"
                    />
                  </label>
                ))}
              </div>
            ) : selection.length > 1 ? (
              <div className="space-y-2">
                <div>{selection.length} items selected</div>
                <div className="text-[#8f8f8f]">
                  Drag any selected box to move the whole group.
                </div>
                <button
                  type="button"
                  onClick={() => setSelection([])}
                  className="w-full border border-[#34343a] px-2 py-1 text-[10px] hover:bg-[#1f1f23]"
                >
                  Clear selection
                </button>
              </div>
            ) : (
              <div className="text-[#8f8f8f]">Select a box on the canvas.</div>
            )}

            <div className="mt-4 border-t border-[#34343a] pt-3">
              <div className="mb-1.5 text-[#8f8f8f]">Fixtures (SVG)</div>
              <ul className="space-y-0.5">
                {sprites.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => selectItem('sprite', s.id)}
                      className={`w-full truncate px-1 py-0.5 text-left hover:bg-[#1f1f23] ${
                        isSelected('sprite', s.id)
                          ? 'bg-[#ff2d6f] text-white'
                          : 'text-[#d4d4d8]'
                      }`}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 border-t border-[#34343a] pt-3">
              <div className="mb-1.5 text-[#8f8f8f]">Banners</div>
              <ul className="space-y-0.5">
                {labels.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => selectItem('label', l.id)}
                      className={`w-full truncate px-1 py-0.5 text-left hover:bg-[#1f1f23] ${
                        isSelected('label', l.id)
                          ? 'bg-[#ff2d6f] text-white'
                          : 'text-[#d4d4d8]'
                      }`}
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 border-t border-[#34343a] pt-3">
              <div className="mb-2 text-[#8f8f8f]">Polygon annotation</div>
              <input
                value={annotationName}
                onChange={(e) => setAnnotationName(e.target.value)}
                placeholder="Name (Toilet, Panggung seats…)"
                className="w-full border border-[#34343a] bg-[#141416] px-1 py-1 text-white placeholder:text-[#6b7280]"
              />
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={annotationColor}
                  onChange={(e) => setAnnotationColor(e.target.value)}
                  className="h-7 w-9 bg-transparent"
                  aria-label="Annotation colour"
                />
                {!drawing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft([]);
                      setDrawing(true);
                    }}
                    className="flex-1 border border-[#34343a] px-2 py-1 text-[10px] hover:bg-[#1f1f23]"
                  >
                    Draw polygon
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finishAnnotation}
                    className="flex-1 border border-[#ff2d6f] bg-[#ff2d6f] px-2 py-1 text-[10px] font-bold text-white"
                  >
                    Finish ({draft.length})
                  </button>
                )}
              </div>
              {drawing && (
                <div className="mt-1 text-[9px] text-[#8f8f8f]">
                  Click the canvas to add points (min 3), then Finish.
                </div>
              )}
              <ul className="mt-2 space-y-1">
                {annotations.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="inline-block size-2 shrink-0"
                        style={{ background: a.color }}
                      />
                      <span className="truncate">{a.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAnnotations((list) => list.filter((x) => x.id !== a.id))
                      }
                      className="text-[#8f8f8f] hover:text-white"
                      aria-label={`Delete ${a.name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              data-geom-export=""
              onClick={exportJson}
              className="mt-3 w-full border border-[#ff2d6f] bg-[#ff2d6f] px-2 py-2 text-[11px] font-bold text-white"
            >
              Record all positions
            </button>
            {json && (
              <textarea
                readOnly
                value={json}
                className="mt-2 h-64 w-full border border-[#34343a] bg-[#141416] p-1 text-[9px] text-[#d4d4d8]"
              />
            )}
          </div>
        </div>

        {tab === 'walkin' && <WalkIn2FEditor />}
      </div>
    </div>
  );
}
