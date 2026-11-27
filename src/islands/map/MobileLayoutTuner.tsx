import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Move, RotateCcw, X } from 'lucide-react';
import { booths } from '../../lib/data';
import { DEV_TOOLS } from '../../lib/dev-tools';
import { sparkyTipDefaults } from '../../lib/map/sparky-tips';
import { useMapStore } from '../../stores/mapStore';

/**
 * DEV-only mobile layout tuner.
 *
 * Every tunable surface carries a `data-layout-tune` attribute. The tuner
 * writes CSS custom properties on `<html>` and a small stylesheet maps them to
 * `translate` / `scale`, so React re-renders never wipe the preview.
 *
 * The scale slider is a measuring probe, NOT a production technique. Copy the
 * measurements, not the scale: a scaled search bar overflows horizontally and
 * pushes the filter trigger off-screen. The search target is therefore locked
 * to scale 1 and gets a real height control instead.
 */

type TuneValue = {
  x: number;
  y: number;
  scale: number;
  /** CSS rotate in degrees (composes with translate/scale). */
  rotate: number;
  z: number;
  /** Real height for the search bar. 0 = use the baked height. */
  height: number;
};

type TuneTarget = {
  id: string;
  label: string;
  origin: string;
};

type Rect = { x: number; y: number; w: number; h: number };
type StyleSnapshot = {
  width: number;
  height: number;
  fontSize: string;
  lineHeight: string;
  padding: string;
  gap: string;
  borderRadius: string;
  borderWidth: string;
};
type Measurement = {
  base: Rect;
  visual: Rect;
  style: StyleSnapshot;
  children?: Record<string, Measurement>;
};

const TARGETS: TuneTarget[] = [
  { id: 'mobile-search', label: 'Search', origin: 'left top' },
  { id: 'filter-button', label: 'Filter button', origin: 'center center' },
  { id: 'brand-lockup', label: 'Brand art', origin: 'right top' },
  { id: 'open-hours', label: 'Open hours', origin: 'right top' },
  { id: 'open-hours-desktop', label: 'Open hours (desktop)', origin: 'right top' },
  { id: 'track-switcher', label: 'Track tabs', origin: 'left top' },
  { id: 'quick-find', label: 'Quick find', origin: 'left top' },
  { id: 'map-controls', label: 'Zoom / compass', origin: 'center center' },
  { id: 'hall-card', label: 'Hall card', origin: 'right bottom' },
  { id: 'map-tooltip', label: 'Tooltip', origin: 'left top' },
  { id: 'sheet-tabs', label: 'Bottom tabs', origin: 'center bottom' },
  // Sparky tip composition: the group moves everything, the children nudge
  // one piece (bubble / name plate / body+hand) inside it.
  { id: 'sparky-tip-career-expo', label: 'Sparky tip (expo)', origin: 'left top' },
  { id: 'sparky-tip-career-expo-dialog', label: 'Sparky bubble (expo)', origin: 'left top' },
  { id: 'sparky-tip-career-expo-name', label: 'Sparky name (expo)', origin: 'left top' },
  { id: 'sparky-tip-career-expo-body', label: 'Sparky body (expo)', origin: 'center bottom' },
  { id: 'sparky-tip-parking', label: 'Sparky tip (parking)', origin: 'left top' },
  { id: 'sparky-tip-parking-dialog', label: 'Sparky bubble (parking)', origin: 'left top' },
  { id: 'sparky-tip-parking-name', label: 'Sparky name (parking)', origin: 'left top' },
  { id: 'sparky-tip-parking-body', label: 'Sparky body (parking)', origin: 'center bottom' },
  { id: 'sparky-tip-career-expo-text', label: 'Sparky text (expo)', origin: 'left top' },
  { id: 'sparky-tip-parking-text', label: 'Sparky text (parking)', origin: 'left top' },
  { id: 'profile-title', label: 'Profile title', origin: 'left top' },
  { id: 'profile-avatar', label: 'Profile avatar', origin: 'left top' },
  { id: 'profile-greeting', label: 'Profile greeting', origin: 'left top' },
];

const SEARCH_DEFAULT_HEIGHT = 56;
const DEFAULT_VALUE: TuneValue = { x: 0, y: 0, scale: 1, rotate: 0, z: 0, height: 0 };
/** Baked Sparky placement doubles as the tuner's starting point. */
const defaultFor = (id: string): TuneValue => {
  const baked = sparkyTipDefaults(id);
  return baked ? { ...DEFAULT_VALUE, ...baked } : DEFAULT_VALUE;
};
const STORAGE_KEY = 'icd:layout-tune:v7';
const LEGACY_STORAGE_KEYS = [
  'icd:layout-tune',
  'icd:layout-tune:v2',
  'icd:layout-tune:v3',
  'icd:layout-tune:v4',
  'icd:layout-tune:v5',
  'icd:layout-tune:v6',
];
const STEPS = [1, 5, 10] as const;

type LayoutState = Record<string, TuneValue>;

type TypeOverride = {
  selector: string;
  label: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
};

type TypeState = Record<string, TypeOverride>;

type PickedType = {
  selector: string;
  label: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
};

const TYPE_STORAGE_KEY = 'icd:layout-tune:type:v2';
const TYPE_LEGACY_KEYS = ['icd:layout-tune:type:v1'];

function loadLayout(): LayoutState {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as LayoutState;
    const next: LayoutState = {};
    for (const target of TARGETS) {
      const base = defaultFor(target.id);
      const raw = parsed[target.id];
      if (!raw) {
        if (base !== DEFAULT_VALUE) next[target.id] = base;
        continue;
      }
      next[target.id] = {
        x: Number.isFinite(Number(raw.x)) ? Number(raw.x) : base.x,
        y: Number.isFinite(Number(raw.y)) ? Number(raw.y) : base.y,
        // Scale is a probe; the search bar and its filter keep real sizes.
        scale:
          target.id === 'mobile-search' || target.id === 'filter-button'
            ? 1
            : Number.isFinite(Number(raw.scale))
              ? Math.min(2, Math.max(0.25, Number(raw.scale)))
              : base.scale,
        z: Number.isFinite(Number(raw.z)) ? Math.max(0, Math.round(Number(raw.z))) : base.z,
        rotate: Number.isFinite(Number(raw.rotate))
          ? Math.max(-180, Math.min(180, Number(raw.rotate)))
          : base.rotate,
        height: Number.isFinite(Number(raw.height)) && Number(raw.height) > 0
          ? Math.min(96, Math.max(32, Number(raw.height)))
          : 0,
      };
    }
    return next;
  } catch {
    return {};
  }
}

function loadTypeOverrides(): TypeState {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(TYPE_STORAGE_KEY) ?? '{}',
    ) as TypeState;
    const next: TypeState = {};
    for (const [selector, raw] of Object.entries(parsed)) {
      if (!raw || typeof selector !== 'string') continue;
      next[selector] = {
        selector,
        label: String(raw.label ?? ''),
        fontSize: Number.isFinite(Number(raw.fontSize)) ? Number(raw.fontSize) : 13,
        fontWeight: Number.isFinite(Number(raw.fontWeight)) ? Number(raw.fontWeight) : 500,
        lineHeight: Number.isFinite(Number(raw.lineHeight)) ? Number(raw.lineHeight) : 1.4,
      };
    }
    return next;
  } catch {
    return {};
  }
}

function selectorFor(element: Element): string {
  if (element.id) return `#${CSS.escape(element.id)}`;
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current !== document.body && parts.length < 7) {
    let part = current.tagName.toLowerCase();
    const parent: HTMLElement | null = current.parentElement;
    if (!parent) break;
    const sameTag = [...parent.children].filter(
      (child) => child.tagName === current!.tagName,
    );
    if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(current) + 1})`;
    parts.unshift(part);
    current = parent;
  }
  return parts.join(' > ');
}

function applyTypeOverride(override: TypeOverride) {
  const element = document.querySelector<HTMLElement>(override.selector);
  if (!element) return;
  element.style.fontSize = `${(override.fontSize / 16).toFixed(4)}rem`;
  element.style.fontWeight = String(override.fontWeight);
  element.style.lineHeight = String(override.lineHeight);
}

function applyAllTypeOverrides(state: TypeState) {
  for (const override of Object.values(state)) applyTypeOverride(override);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function rectOf(element: Element): Rect {
  const rect = element.getBoundingClientRect();
  return {
    x: round(rect.x),
    y: round(rect.y),
    w: round(rect.width),
    h: round(rect.height),
  };
}

function styleOf(element: Element): StyleSnapshot {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    width: round(rect.width),
    height: round(rect.height),
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    padding: style.padding,
    gap: style.gap,
    borderRadius: style.borderRadius,
    borderWidth: style.borderWidth,
  };
}

/** Measure the element with the tuner transform temporarily removed. */
function measureElement(element: Element, host: Element): Measurement {
  const visual = rectOf(element);
  const tuned = host.hasAttribute('data-lt-tuned');
  if (tuned) host.removeAttribute('data-lt-tuned');
  const base = rectOf(element);
  if (tuned) host.setAttribute('data-lt-tuned', '1');
  return { base, visual, style: styleOf(element) };
}

function measureTarget(id: string): Measurement | null {
  const host = document.querySelector<HTMLElement>(`[data-layout-tune="${id}"]`);
  if (!host) return null;

  if (id === 'mobile-search') {
    const field = host.querySelector('[data-search-field]');
    const filter = host.querySelector('[data-search-filter]');
    const children: Record<string, Measurement> = {};
    if (field) children.field = measureElement(field, host);
    if (filter) children.filter = measureElement(filter, host);
    return { ...measureElement(host, host), children };
  }

  if (id === 'filter-button') {
    return measureElement(host, host);
  }

  if (id === 'map-tooltip') {
    const bubble = host.querySelector('.map-tooltip');
    if (!bubble) return null;
    return measureElement(bubble, host);
  }

  if (id === 'brand-lockup') {
    const art = host.querySelector('[aria-label]') ?? host;
    const children: Record<string, Measurement> = {};
    children.art = measureElement(art, host);
    return { ...measureElement(host, host), children };
  }

  if (id === 'track-switcher') {
    const children: Record<string, Measurement> = {};
    host.querySelectorAll('[role="tab"]').forEach((tab, index) => {
      const label = (tab.textContent || '').trim() || `tab-${index}`;
      children[label] = measureElement(tab, host);
    });
    return { ...measureElement(host, host), children };
  }

  if (id === 'quick-find') {
    const children: Record<string, Measurement> = {};
    host.querySelectorAll('button').forEach((button, index) => {
      const label = (button.textContent || '').trim() || `chip-${index}`;
      children[label] = measureElement(button, host);
    });
    return { ...measureElement(host, host), children };
  }

  if (id === 'sheet-tabs') {
    const children: Record<string, Measurement> = {};
    host.querySelectorAll('button').forEach((button, index) => {
      const label = button.getAttribute('aria-label') || `tab-${index}`;
      children[label] = measureElement(button, host);
    });
    return { ...measureElement(host, host), children };
  }

  if (id === 'hall-card') {
    const button = host.querySelector('button');
    const children = button ? { button: measureElement(button, host) } : undefined;
    return { ...measureElement(host, host), ...(children ? { children } : {}) };
  }

  if (id === 'map-controls') {
    const children: Record<string, Measurement> = {};
    host.querySelectorAll('button').forEach((button, index) => {
      const label = button.getAttribute('aria-label') || `control-${index}`;
      children[label] = measureElement(button, host);
    });
    return { ...measureElement(host, host), children };
  }

  return measureElement(host, host);
}

function buildCss(): string {
  const rules = TARGETS.filter(
    (target) =>
      target.id !== 'map-tooltip' &&
      target.id !== 'mobile-search' &&
      target.id !== 'filter-button',
  )
    .map(
      (target) => `[data-layout-tune="${target.id}"][data-lt-tuned] {
  translate: var(--lt-${target.id}-x, 0px) var(--lt-${target.id}-y, 0px);
  rotate: var(--lt-${target.id}-rotate, 0deg);
  scale: var(--lt-${target.id}-scale, 1);
  transform-origin: ${target.origin};
}`,
    )
    .join('\n');

  // Search: position may be tuned, but size is real. Never scale the bar —
  // scaling its width pushes the filter trigger outside the viewport.
  const searchRule = `[data-layout-tune="mobile-search"] {
  translate: var(--lt-mobile-search-x, 0px) var(--lt-mobile-search-y, 0px);
}
[data-layout-tune="mobile-search"] [data-search-field] {
  height: var(--lt-mobile-search-height, ${SEARCH_DEFAULT_HEIGHT}px);
}`;

  // Filter trigger: real square size, no scale.
  const filterRule = `[data-layout-tune="filter-button"] {
  translate: var(--lt-filter-button-x, 0px) var(--lt-filter-button-y, 0px);
  width: var(--lt-filter-button-height, ${SEARCH_DEFAULT_HEIGHT}px);
  height: var(--lt-filter-button-height, ${SEARCH_DEFAULT_HEIGHT}px);
}`;

  // The tooltip host is a zero-size anchor at the map stage origin; scaling
  // it would scale from the stage corner. Scale the bubble itself instead so
  // the booth anchor stays put.
  const tooltipRule = `[data-layout-tune="map-tooltip"][data-lt-tuned] .map-tooltip {
  translate: var(--lt-map-tooltip-x, 0px) var(--lt-map-tooltip-y, 0px);
  scale: var(--lt-map-tooltip-scale, 1);
  transform-origin: left top;
}`;

  const outlines = TARGETS.map((target) => {
    if (target.id === 'map-tooltip') {
      return `html[data-lt-selected="map-tooltip"] [data-layout-tune="map-tooltip"] .map-tooltip {
  outline: 2px dashed #ff2d6f;
  outline-offset: 4px;
}`;
    }
    return `html[data-lt-selected="${target.id}"] [data-layout-tune="${target.id}"] {
  outline: 2px dashed #ff2d6f;
  outline-offset: 4px;
}`;
  }).join('\n');

  const zRules = TARGETS.map((target) => {
    if (target.id === 'map-tooltip') {
      return `[data-layout-tune="map-tooltip"][data-lt-z] { z-index: var(--lt-map-tooltip-z); }
[data-layout-tune="map-tooltip"][data-lt-z] .map-tooltip { z-index: var(--lt-map-tooltip-z); }`;
    }
    return `[data-layout-tune="${target.id}"][data-lt-z] { z-index: var(--lt-${target.id}-z); }`;
  }).join('\n');

  return `${rules}\n${searchRule}\n${filterRule}\n${tooltipRule}\n${outlines}\n${zRules}
[data-lt-picked] {
  outline: 2px solid #6B97FF !important;
  outline-offset: 2px;
}
html[data-lt-selected="map-tooltip"] [data-layout-tune="map-tooltip"] .map-tooltip {
  pointer-events: auto !important;
  cursor: grab;
}
html[data-lt-dragging="1"] [data-layout-tune] {
  cursor: grabbing !important;
}`;
}

function syncTargetAttributes(layout: LayoutState) {
  for (const target of TARGETS) {
    const element = document.querySelector<HTMLElement>(
      `[data-layout-tune="${target.id}"]`,
    );
    if (!element) continue;
    const value = layout[target.id] ?? defaultFor(target.id);
    const visualProbe =
      value.x !== 0 || value.y !== 0 || value.scale !== 1 || value.rotate !== 0;
    if (visualProbe) element.dataset.ltTuned = '1';
    else delete element.dataset.ltTuned;
    if (value.z > 0) element.dataset.ltZ = '1';
    else delete element.dataset.ltZ;
  }
}

export default function MobileLayoutTuner() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>('track-switcher');
  const [dragEnabled, setDragEnabled] = useState(true);
  const [step, setStep] = useState<(typeof STEPS)[number]>(1);
  const [layout, setLayout] = useState<LayoutState>(() => loadLayout());
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [typeOverrides, setTypeOverrides] = useState<TypeState>(() => loadTypeOverrides());
  const [pickMode, setPickMode] = useState(false);
  const [picked, setPicked] = useState<PickedType | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const selectedBoothId = useMapStore((s) => s.selectedBoothId);
  const layoutRef = useRef(layout);
  const css = useMemo(buildCss, []);

  layoutRef.current = layout;

  const applyLayout = useCallback((next: LayoutState) => {
    const root = document.documentElement;
    for (const target of TARGETS) {
      const value = next[target.id] ?? defaultFor(target.id);
      root.style.setProperty(`--lt-${target.id}-x`, `${round(value.x)}px`);
      root.style.setProperty(`--lt-${target.id}-y`, `${round(value.y)}px`);
      root.style.setProperty(`--lt-${target.id}-scale`, String(round(value.scale)));
      root.style.setProperty(`--lt-${target.id}-rotate`, `${round(value.rotate)}deg`);
      root.style.setProperty(`--lt-${target.id}-z`, String(value.z));
    }
    const searchHeight = next['mobile-search']?.height || SEARCH_DEFAULT_HEIGHT;
    root.style.setProperty('--lt-mobile-search-height', `${round(searchHeight)}px`);
    const filterHeight = next['filter-button']?.height || SEARCH_DEFAULT_HEIGHT;
    root.style.setProperty('--lt-filter-button-height', `${round(filterHeight)}px`);
    syncTargetAttributes(next);
  }, []);

  useEffect(() => {
    applyLayout(layout);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      for (const key of LEGACY_STORAGE_KEYS) window.localStorage.removeItem(key);
    } catch {
      // Storage is optional in private windows.
    }
    // Map islands hydrate after this component; re-apply attributes when
    // delayed targets (controls, tooltip) have mounted.
    const retries = [0, 400, 1200, 2400].map((delay) =>
      window.setTimeout(() => syncTargetAttributes(layoutRef.current), delay),
    );
    // Tips and tooltips mount after hydration / tab switches; keep re-syncing
    // the tuned attributes on the same cadence as the type overrides.
    const interval = window.setInterval(
      () => syncTargetAttributes(layoutRef.current),
      1200,
    );
    return () => {
      retries.forEach((timer) => window.clearTimeout(timer));
      window.clearInterval(interval);
    };
  }, [applyLayout, layout]);

  useEffect(() => {
    applyAllTypeOverrides(typeOverrides);
    try {
      window.localStorage.setItem(TYPE_STORAGE_KEY, JSON.stringify(typeOverrides));
      for (const key of TYPE_LEGACY_KEYS) window.localStorage.removeItem(key);
    } catch {
      // Storage is optional in private windows.
    }
    // Tray content remounts on tab switches; reapply so the preview survives.
    const id = window.setInterval(() => applyAllTypeOverrides(typeOverrides), 1200);
    return () => window.clearInterval(id);
  }, [typeOverrides]);

  useEffect(() => {
    if (!open) return;
    const update = () => setMeasurement(measureTarget(selected));
    update();
    const raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [layout, open, selected, selectedBoothId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const value = layout[selected] ?? defaultFor(selected);
  const isSearch = selected === 'mobile-search';
  const isSized = isSearch || selected === 'filter-button';

  const updateSelected = useCallback(
    (patch: Partial<TuneValue>) => {
      setLayout((prev) => ({
        ...prev,
        [selected]: { ...DEFAULT_VALUE, ...prev[selected], ...patch },
      }));
    },
    [selected],
  );

  const updatePicked = (patch: Partial<PickedType>) => {
    if (!picked) return;
    const next = { ...picked, ...patch };
    setPicked(next);
    setTypeOverrides((prev) => ({
      ...prev,
      [next.selector]: { ...next },
    }));
  };

  const resetPicked = () => {
    if (!picked) return;
    const selector = picked.selector;
    setTypeOverrides((prev) => {
      const next = { ...prev };
      delete next[selector];
      return next;
    });
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      element.style.fontSize = '';
      element.style.fontWeight = '';
      element.style.lineHeight = '';
    }
    setPicked(null);
  };

  const nudge = (dx: number, dy: number) => {
    updateSelected({ x: round(value.x + dx), y: round(value.y + dy) });
  };

  const resetTarget = () => {
    setLayout((prev) => {
      const next = { ...prev };
      delete next[selected];
      return next;
    });
  };

  const resetAll = () => {
    setLayout({});
  };

  const collectLayout = (): LayoutState => {
    const snapshot: LayoutState = {};
    for (const target of TARGETS) {
      const current = layout[target.id] ?? defaultFor(target.id);
      snapshot[target.id] = {
        ...current,
        scale:
          target.id === 'mobile-search' || target.id === 'filter-button'
            ? 1
            : round(current.scale),
        height: round(current.height),
      };
    }
    return snapshot;
  };

  const copyJson = async () => {
    const measurements: Record<string, Measurement | null> = {};
    for (const target of TARGETS) measurements[target.id] = measureTarget(target.id);

    const payload = {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio,
      },
      layout: collectLayout(),
      measurements,
      typography: picked ? { ...picked } : null,
      typeOverrides,
    };
    await copyText(JSON.stringify(payload, null, 2), 'Layout + measurements copied');
  };

  /** Only the Sparky tip targets, shaped for sparky-tips.json. */
  const copySparkyJson = async () => {
    const snapshot: Record<
      string,
      { x: number; y: number; rotate: number; scale: number; z: number }
    > = {};
    for (const target of TARGETS) {
      if (!target.id.startsWith('sparky-tip-')) continue;
      const current = layout[target.id] ?? defaultFor(target.id);
      snapshot[target.id.replace('sparky-tip-', '')] = {
        x: round(current.x),
        y: round(current.y),
        rotate: round(current.rotate),
        scale: round(current.scale),
        z: current.z,
      };
    }
    await copyText(JSON.stringify(snapshot, null, 2), 'Sparky JSON copied');
  };

  const copySizes = async () => {
    const lines = [
      `viewport ${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x`,
    ];
    for (const target of TARGETS) {
      const measured = measureTarget(target.id);
      if (!measured) {
        lines.push(`${target.id}: not visible`);
        continue;
      }
      const { base, visual } = measured;
      const note =
        base.w !== visual.w || base.h !== visual.h
          ? ` (probe ${round(visual.w / Math.max(1, base.w))}x, ${round(visual.h / Math.max(1, base.h))}x)`
          : '';
      lines.push(
        `${target.id}: base ${base.w}x${base.h} -> visual ${visual.w}x${visual.h}${note}`,
      );
      if (measured.children) {
        for (const [name, child] of Object.entries(measured.children)) {
          lines.push(
            `  ${name}: base ${child.base.w}x${child.base.h} -> visual ${child.visual.w}x${child.visual.h}; font ${child.style.fontSize}; pad ${child.style.padding}; gap ${child.style.gap}; radius ${child.style.borderRadius}`,
          );
        }
      }
    }
    if (picked) {
      lines.push(
        `picked type: ${picked.label} -> ${round(picked.fontSize)}px / ${picked.fontWeight} / lh ${picked.lineHeight.toFixed(2)}`,
      );
    }
    await copyText(lines.join('\n'), 'Size table copied');
  };

  const copyTypeCss = async () => {
    if (!picked) return;
    const css = `/* ${picked.label} */\n${picked.selector} {\n  font-size: ${(picked.fontSize / 16).toFixed(4)}rem; /* ${round(picked.fontSize)}px */\n  font-weight: ${picked.fontWeight};\n  line-height: ${picked.lineHeight.toFixed(2)};\n}`;
    await copyText(css, 'Type CSS copied');
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      // execCommand is the only synchronous fallback; the DOM lib marks it
      // deprecated, and the async Clipboard API already failed above.
      const exec = (document as unknown as { execCommand(id: string): boolean })
        .execCommand;
      exec('copy');
      textarea.remove();
    }
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const toggleTooltipSample = () => {
    const store = useMapStore.getState();
    if (selectedBoothId) {
      store.selectBooth(null);
      return;
    }
    const first =
      booths.find((booth) => booth.areaId === store.selectedAreaId) ?? booths[0];
    if (first) store.selectBooth(first.id);
  };

  // Capture-phase drag: stop the underlying button/map gesture, move the
  // selected element with the pointer, and suppress the click that follows.
  useEffect(() => {
    if (!open || !dragEnabled) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      const origin = event.target;
      if (!(origin instanceof Element)) return;
      if (origin.closest('[data-layout-tuner-ui]')) return;
      // Grab anywhere inside the selected target: for a Sparky tip the group
      // wraps the bubble, plate and body, so dragging any child moves the
      // whole composition; selecting a child drags only that child.
      const element = origin.closest<HTMLElement>(
        `[data-layout-tune="${selected}"]`,
      );
      if (!element) return;

      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startY = event.clientY;
      const start = { ...DEFAULT_VALUE, ...layoutRef.current[selected] };
      let latest = start;
      let moved = false;
      let frame = 0;
      const previousTouchAction = element.style.touchAction;
      element.style.touchAction = 'none';
      document.documentElement.dataset.ltDragging = '1';
      element.style.cursor = 'grabbing';

      const onMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
        latest = { ...start, x: round(start.x + dx), y: round(start.y + dy) };
        if (frame) return;
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          layoutRef.current = { ...layoutRef.current, [selected]: latest };
          applyLayout(layoutRef.current);
        });
      };

      const finish = () => {
        if (frame) window.cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', finish);
        element.style.touchAction = previousTouchAction;
        element.style.cursor = '';
        delete document.documentElement.dataset.ltDragging;
        setLayout((prev) => ({ ...prev, [selected]: latest }));

        if (moved) {
          const swallow = (clickEvent: MouseEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
          };
          window.addEventListener('click', swallow, { capture: true, once: true });
          window.setTimeout(() => {
            window.removeEventListener('click', swallow, true);
          }, 350);
        }
      };

      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', finish);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [applyLayout, dragEnabled, open, selected]);

  useEffect(() => {
    if (!open || !pickMode) return;
    const onPick = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-layout-tuner-ui]')) return;
      if (!target.closest('[data-tray-root]')) return;
      if (target instanceof SVGElement) return;
      const text = (target.textContent || '').trim();
      if (!text) return;

      event.preventDefault();
      event.stopPropagation();

      const selector = selectorFor(target);
      const existing = typeOverrides[selector];
      const style = getComputedStyle(target);
      const fontSize = parseFloat(style.fontSize) || 13;
      const lineHeight = parseFloat(style.lineHeight);
      setPicked({
        selector,
        label: text.replace(/\s+/g, ' ').slice(0, 48),
        fontSize: existing?.fontSize ?? fontSize,
        fontWeight: existing?.fontWeight ?? (parseInt(style.fontWeight, 10) || 500),
        lineHeight:
          existing?.lineHeight ??
          (Number.isFinite(lineHeight) ? lineHeight / fontSize : 1.4),
      });
      setPickMode(false);
      setDragEnabled(false);

      const swallow = (clickEvent: MouseEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      };
      window.addEventListener('click', swallow, { capture: true, once: true });
      window.setTimeout(() => {
        window.removeEventListener('click', swallow, true);
      }, 350);
    };
    document.addEventListener('pointerdown', onPick, true);
    return () => document.removeEventListener('pointerdown', onPick, true);
  }, [open, pickMode, typeOverrides]);

  useEffect(() => {
    if (!picked || !open) {
      document
        .querySelectorAll('[data-lt-picked]')
        .forEach((element) => element.removeAttribute('data-lt-picked'));
      return;
    }
    const mark = () => {
      document
        .querySelectorAll('[data-lt-picked]')
        .forEach((element) => element.removeAttribute('data-lt-picked'));
      document.querySelector(picked.selector)?.setAttribute('data-lt-picked', '1');
    };
    mark();
    const id = window.setInterval(mark, 1200);
    return () => {
      window.clearInterval(id);
      document
        .querySelectorAll('[data-lt-picked]')
        .forEach((element) => element.removeAttribute('data-lt-picked'));
    };
  }, [open, picked]);

  useEffect(() => {
    if (!open) {
      delete document.documentElement.dataset.ltSelected;
      return;
    }
    document.documentElement.dataset.ltSelected = selected;
    return () => {
      delete document.documentElement.dataset.ltSelected;
    };
  }, [open, selected]);

  if (!DEV_TOOLS) return null;

  return (
    <>
      <style>{css}</style>

      {!open && (
        <button
          type="button"
          data-layout-tuner-ui
          onClick={() => setOpen(true)}
          className="fixed left-1.5 top-1/2 z-[96] flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#34343a] bg-[#141416] text-white shadow-xl active:scale-95"
          aria-label="Open layout tuner"
          title="Layout tuner"
        >
          <Move size={14} />
        </button>
      )}

      {open && (
        <div
          data-layout-tuner-ui
          className="fixed left-1.5 top-14 z-[96] flex max-h-[calc(100dvh-7rem)] w-[min(20rem,calc(100vw-0.75rem))] flex-col overflow-y-auto rounded-md border border-line bg-[#0c0c0f] p-2.5 font-mono text-[10px] text-white shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold tracking-[0.08em]">LAYOUT TUNER</div>
              <div className="mt-0.5 text-[9px] text-zinc-500">
                {window.innerWidth}×{window.innerHeight} · scale is a probe
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-[#34343a] hover:bg-[#1f1f23]"
              aria-label="Close layout tuner"
            >
              <X size={12} />
            </button>
          </div>

          <div className="mb-1 text-[9px] uppercase tracking-[0.12em] text-zinc-500">Target</div>
          <div className="mb-2 grid grid-cols-2 gap-1">
            {TARGETS.map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => setSelected(target.id)}
                className={`truncate rounded-sm border px-1.5 py-1 text-left text-[9.5px] transition-colors ${
                  selected === target.id
                    ? 'border-[var(--accent-pink)] bg-[var(--accent-pink)]/15 text-white'
                    : 'border-[#2a2a2e] text-zinc-400 hover:border-[#4a4a52] hover:text-white'
                }`}
              >
                {target.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setDragEnabled((valueState) => !valueState);
              setPickMode(false);
            }}
            className={`mb-2 flex items-center justify-between rounded-sm border px-2 py-1 text-[9.5px] ${
              dragEnabled
                ? 'border-[var(--accent-pink)]/60 bg-[var(--accent-pink)]/10 text-white'
                : 'border-[#2a2a2e] text-zinc-400'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Move size={11} /> Drag on page
            </span>
            <span className={dragEnabled ? 'text-[var(--accent-pink)]' : 'text-zinc-500'}>
              {dragEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPickMode((valueState) => !valueState);
              setDragEnabled(false);
            }}
            className={`mb-2 rounded-sm border px-2 py-1 text-[9.5px] ${
              pickMode
                ? 'border-[#6B97FF] bg-[#6B97FF]/10 text-white'
                : 'border-[#2a2a2e] text-zinc-300 hover:bg-[#1f1f23]'
            }`}
          >
            {pickMode ? 'Tap a tray element…' : 'Pick tray text'}
          </button>

          <div className="mb-1 flex items-baseline justify-between text-[10px]">
            <span className="text-zinc-500">offset</span>
            <span>
              x <b className="text-white">{round(value.x)}</b> · y{' '}
              <b className="text-white">{round(value.y)}</b>
            </span>
          </div>

          {isSized ? (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-zinc-500">{isSearch ? 'height' : 'size'}</span>
              <input
                type="range"
                min="40"
                max="72"
                step="1"
                value={value.height || SEARCH_DEFAULT_HEIGHT}
                onChange={(event) => updateSelected({ height: Number(event.target.value) })}
                className="min-w-0 flex-1 accent-[var(--accent-pink)]"
                aria-label={isSearch ? 'Real search bar height' : 'Real filter button size'}
              />
              <span className="w-9 text-right text-white">
                {value.height || SEARCH_DEFAULT_HEIGHT}px
              </span>
            </div>
          ) : (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-zinc-500">scale</span>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.01"
                value={value.scale}
                onChange={(event) => updateSelected({ scale: Number(event.target.value) })}
                className="min-w-0 flex-1 accent-[var(--accent-pink)]"
                aria-label="Scale selected element"
              />
              <span className="w-9 text-right text-white">{round(value.scale)}</span>
            </div>
          )}

          <div className="mb-2 flex items-center gap-2">
            <span className="text-zinc-500">rotate</span>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={value.rotate}
              onChange={(event) => updateSelected({ rotate: Number(event.target.value) })}
              className="min-w-0 flex-1 accent-[var(--accent-pink)]"
              aria-label="Rotate selected element"
            />
            <span className="w-9 text-right text-white">{round(value.rotate)}°</span>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <span className="text-zinc-500">z-index</span>
            <input
              type="range"
              min="0"
              max="70"
              step="1"
              value={value.z}
              onChange={(event) => updateSelected({ z: Number(event.target.value) })}
              className="min-w-0 flex-1 accent-[var(--accent-pink)]"
              aria-label="Z-index of selected element"
            />
            <span className="w-9 text-right text-white">{value.z > 0 ? value.z : 'auto'}</span>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-zinc-500">nudge</span>
            <div className="flex gap-1">
              {STEPS.map((stepSize) => (
                <button
                  key={stepSize}
                  type="button"
                  onClick={() => setStep(stepSize)}
                  className={`rounded-sm border px-1.5 py-0.5 text-[9px] ${
                    step === stepSize
                      ? 'border-[var(--accent-pink)] text-white'
                      : 'border-[#2a2a2e] text-zinc-400'
                  }`}
                >
                  {stepSize}px
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto mb-2 grid w-28 grid-cols-3 gap-1">
            <span />
            <button
              type="button"
              onClick={() => nudge(0, -step)}
              className="rounded-sm border border-[#2a2a2e] py-1 hover:bg-[#1f1f23]"
              aria-label="Nudge up"
            >
              ↑
            </button>
            <span />
            <button
              type="button"
              onClick={() => nudge(-step, 0)}
              className="rounded-sm border border-[#2a2a2e] py-1 hover:bg-[#1f1f23]"
              aria-label="Nudge left"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => nudge(0, step)}
              className="rounded-sm border border-[#2a2a2e] py-1 hover:bg-[#1f1f23]"
              aria-label="Nudge down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => nudge(step, 0)}
              className="rounded-sm border border-[#2a2a2e] py-1 hover:bg-[#1f1f23]"
              aria-label="Nudge right"
            >
              →
            </button>
          </div>

          {measurement && (
            <div className="mb-2 space-y-0.5 border-t border-[#242428] pt-2 text-[9px] leading-relaxed text-zinc-400">
              <div className="flex justify-between gap-2">
                <span>base</span>
                <span className="text-right text-zinc-200">
                  {measurement.base.w} × {measurement.base.h}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>visual</span>
                <span className="text-right text-zinc-200">
                  {measurement.visual.w} × {measurement.visual.h}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>font / pad</span>
                <span className="text-right text-zinc-200">
                  {measurement.style.fontSize} / {measurement.style.padding}
                </span>
              </div>
              {measurement.children &&
                Object.entries(measurement.children).map(([name, child]) => (
                  <div key={name} className="flex justify-between gap-2">
                    <span className="truncate">{name}</span>
                    <span className="shrink-0 text-right text-zinc-200">
                      {child.visual.w} × {child.visual.h}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {picked && (
            <div className="mb-2 space-y-1.5 border-t border-[#6B97FF]/30 pt-2 text-[9px]">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[#9DBBFF]">type: {picked.label}</span>
                <button
                  type="button"
                  onClick={resetPicked}
                  className="shrink-0 text-zinc-500 hover:text-white"
                >
                  reset
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-zinc-500">size</span>
                <input
                  type="range"
                  min="10"
                  max="28"
                  step="0.5"
                  value={picked.fontSize}
                  onChange={(event) => updatePicked({ fontSize: Number(event.target.value) })}
                  className="min-w-0 flex-1 accent-[#6B97FF]"
                  aria-label="Picked font size"
                />
                <span className="w-16 shrink-0 text-right text-zinc-200">
                  {round(picked.fontSize)}px
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-zinc-500">weight</span>
                <select
                  value={picked.fontWeight}
                  onChange={(event) => updatePicked({ fontWeight: Number(event.target.value) })}
                  className="min-w-0 flex-1 rounded-sm border border-[#2a2a2e] bg-[#141416] px-1 py-0.5 text-[9px] text-white"
                  aria-label="Picked font weight"
                >
                  {[400, 500, 600, 700].map((weight) => (
                    <option key={weight} value={weight}>
                      {weight}
                    </option>
                  ))}
                </select>
                <span className="w-16 shrink-0 text-right text-zinc-500">
                  {(picked.fontSize / 16).toFixed(2)}rem
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-zinc-500">line</span>
                <input
                  type="range"
                  min="1"
                  max="1.8"
                  step="0.05"
                  value={picked.lineHeight}
                  onChange={(event) => updatePicked({ lineHeight: Number(event.target.value) })}
                  className="min-w-0 flex-1 accent-[#6B97FF]"
                  aria-label="Picked line height"
                />
                <span className="w-16 shrink-0 text-right text-zinc-200">
                  {picked.lineHeight.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void copyTypeCss()}
                className="w-full rounded-sm border border-[#6B97FF]/40 bg-[#6B97FF]/10 px-1.5 py-1 text-[9px] font-semibold text-white hover:bg-[#6B97FF]/20"
              >
                Copy type CSS
              </button>
            </div>
          )}

          {selected === 'map-tooltip' && (
            <button
              type="button"
              onClick={toggleTooltipSample}
              className="mb-2 rounded-sm border border-[#2a2a2e] px-2 py-1 text-[9.5px] text-zinc-300 hover:bg-[#1f1f23]"
            >
              {selectedBoothId ? 'Hide tooltip sample' : 'Show tooltip sample'}
            </button>
          )}

          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={resetTarget}
              className="flex items-center justify-center gap-1 rounded-sm border border-[#2a2a2e] px-1.5 py-1 text-[9px] text-zinc-300 hover:bg-[#1f1f23]"
            >
              <RotateCcw size={10} /> Reset target
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-sm border border-[#2a2a2e] px-1.5 py-1 text-[9px] text-zinc-300 hover:bg-[#1f1f23]"
            >
              Reset all
            </button>
            <button
              type="button"
              onClick={() => void copyJson()}
              className="rounded-sm border border-[#34343a] bg-[#1b1b1f] px-1.5 py-1 text-[9px] font-semibold text-white hover:bg-[#26262b]"
            >
              Copy JSON
            </button>
            <button
              type="button"
              onClick={() => void copySizes()}
              className="rounded-sm border border-[#34343a] bg-[#1b1b1f] px-1.5 py-1 text-[9px] font-semibold text-white hover:bg-[#26262b]"
            >
              Copy sizes
            </button>
            <button
              type="button"
              onClick={() => void copySparkyJson()}
              className="rounded-sm border border-[#34343a] bg-[#1b1b1f] px-1.5 py-1 text-[9px] font-semibold text-white hover:bg-[#26262b]"
            >
              Copy Sparky
            </button>
          </div>

          <div className="mt-1.5 min-h-[12px] text-center text-[9px] text-[var(--accent-pink)]">
            {copied ?? ''}
          </div>
        </div>
      )}
    </>
  );
}
