import { useState } from 'react';
import { Bug, Check, ChevronDown, ChevronUp, Copy, Eye, EyeOff, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { LayerId, SparkyConfig } from './config';
import { LAYER_LABELS } from './config';

type Props = {
  config: SparkyConfig;
  setConfig: Dispatch<SetStateAction<SparkyConfig>>;
  selected: LayerId;
  onSelect: (id: LayerId) => void;
  outlines: boolean;
  setOutlines: (value: boolean) => void;
  paused: boolean;
  setPaused: (value: boolean) => void;
  onCopy: () => void;
  copied: boolean;
};

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[10px] uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1 min-w-0 flex-1 accent-[#cdf129]"
      />
      <span className="w-10 shrink-0 text-right font-mono text-[10px] text-zinc-300">
        {Number.isInteger(value) ? value : value.toFixed(2)}
      </span>
    </label>
  );
}

export default function SparkyDebugPanel({
  config,
  setConfig,
  selected,
  onSelect,
  outlines,
  setOutlines,
  paused,
  setPaused,
  onCopy,
  copied,
}: Props) {
  const [open, setOpen] = useState(true);

  const moveLayer = (id: LayerId, direction: -1 | 1) => {
    setConfig((current) => {
      const order = [...current.zIndexOrder];
      const from = order.indexOf(id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= order.length) return current;
      [order[from], order[to]] = [order[to], order[from]];
      return { ...current, zIndexOrder: order };
    });
  };

  const offset = config.initialOffsets[selected];
  const setOffset = (patch: Partial<typeof offset>) =>
    setConfig((current) => ({
      ...current,
      initialOffsets: {
        ...current.initialOffsets,
        [selected]: { ...current.initialOffsets[selected], ...patch },
      },
    }));

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-3 bottom-20 z-[60] flex items-center gap-1.5 rounded-full border border-white/15 bg-[#141416]/95 px-3 py-2 text-[11px] font-bold text-white shadow-lg backdrop-blur md:bottom-3"
      >
        <Bug size={14} /> Sparky debug
      </button>
    );
  }

  return (
    <div className="fixed right-3 bottom-20 z-[60] max-h-[min(78vh,640px)] w-[286px] overflow-y-auto rounded-lg border border-white/15 bg-[#141416]/95 p-3 text-white shadow-2xl backdrop-blur md:bottom-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
          <Bug size={14} className="text-[#cdf129]" /> Sparky debug
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Collapse Sparky debug"
          className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mb-3 space-y-1">
        {[...config.zIndexOrder].reverse().map((id) => {
          const z = config.zIndexOrder.indexOf(id);
          return (
            <div
              key={id}
              className={`flex items-center gap-1 rounded px-1 py-0.5 ${
                selected === id ? 'bg-white/10' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(id)}
                className="min-w-0 flex-1 truncate text-left text-[11px]"
              >
                <span className="mr-1 font-mono text-[10px] text-zinc-400">z{z}</span>
                {LAYER_LABELS[id]}
              </button>
              <button
                type="button"
                onClick={() => moveLayer(id, 1)}
                disabled={z === config.zIndexOrder.length - 1}
                aria-label={`Raise ${LAYER_LABELS[id]}`}
                className="rounded p-0.5 text-zinc-400 hover:bg-white/10 disabled:opacity-25"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => moveLayer(id, -1)}
                disabled={z === 0}
                aria-label={`Lower ${LAYER_LABELS[id]}`}
                className="rounded p-0.5 text-zinc-400 hover:bg-white/10 disabled:opacity-25"
              >
                <ChevronDown size={12} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfig((current) => ({
                    ...current,
                    initialOffsets: {
                      ...current.initialOffsets,
                      [id]: {
                        ...current.initialOffsets[id],
                        visible: !current.initialOffsets[id].visible,
                      },
                    },
                  }))
                }
                aria-label={`Toggle ${LAYER_LABELS[id]} visibility`}
                className="rounded p-0.5 text-zinc-400 hover:bg-white/10"
              >
                {config.initialOffsets[id].visible ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mb-2 border-t border-white/10 pt-2">
        <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-400">
          {LAYER_LABELS[selected]} offset <span className="normal-case">(arrows = 1px)</span>
        </p>
        <div className="space-y-1">
          <Slider
            label="X"
            value={offset.x}
            min={-300}
            max={300}
            onChange={(x) => setOffset({ x })}
          />
          <Slider
            label="Y"
            value={offset.y}
            min={-300}
            max={300}
            onChange={(y) => setOffset({ y })}
          />
          <Slider
            label="Scale"
            value={offset.scale}
            min={0.3}
            max={2}
            step={0.05}
            onChange={(scale) => setOffset({ scale })}
          />
          <Slider
            label="Rotate"
            value={offset.rotate}
            min={-180}
            max={180}
            onChange={(rotate) => setOffset({ rotate })}
          />
        </div>
      </div>

      <div className="mb-2 border-t border-white/10 pt-2">
        <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-400">
          Stage (label z-10 / pins z-20)
        </p>
        <div className="space-y-1">
          <Slider
            label="X"
            value={config.stageOffset.x}
            min={-300}
            max={300}
            onChange={(x) =>
              setConfig((current) => ({
                ...current,
                stageOffset: { ...current.stageOffset, x },
              }))
            }
          />
          <Slider
            label="Y"
            value={config.stageOffset.y}
            min={-300}
            max={300}
            onChange={(y) =>
              setConfig((current) => ({
                ...current,
                stageOffset: { ...current.stageOffset, y },
              }))
            }
          />
          <Slider
            label="Rotate"
            value={config.stageOffset.rotate}
            min={-180}
            max={180}
            onChange={(rotate) =>
              setConfig((current) => ({
                ...current,
                stageOffset: { ...current.stageOffset, rotate },
              }))
            }
          />
          <Slider
            label="Z"
            value={config.stageZIndex}
            min={0}
            max={30}
            onChange={(stageZIndex) =>
              setConfig((current) => ({ ...current, stageZIndex }))
            }
          />
        </div>
      </div>

      <div className="mb-2 border-t border-white/10 pt-2">
        <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-400">Tracking</p>
        <div className="space-y-1">
          <Slider
            label="Radius"
            value={config.maxRadius}
            min={0}
            max={40}
            onChange={(maxRadius) => setConfig((current) => ({ ...current, maxRadius }))}
          />
          <Slider
            label="Stiff"
            value={config.spring.stiffness}
            min={20}
            max={600}
            step={5}
            onChange={(stiffness) =>
              setConfig((current) => ({
                ...current,
                spring: { ...current.spring, stiffness },
              }))
            }
          />
          <Slider
            label="Damp"
            value={config.spring.damping}
            min={2}
            max={80}
            onChange={(damping) =>
              setConfig((current) => ({
                ...current,
                spring: { ...current.spring, damping },
              }))
            }
          />
        </div>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px]">
          <input
            type="checkbox"
            checked={paused}
            onChange={(event) => setPaused(event.target.checked)}
            className="accent-[#cdf129]"
          />
          Pause tracking (neutral 0,0)
        </label>
        <label className="mt-1 flex cursor-pointer items-center gap-2 text-[11px]">
          <input
            type="checkbox"
            checked={outlines}
            onChange={(event) => setOutlines(event.target.checked)}
            className="accent-[#cdf129]"
          />
          Wireframe outlines + clamp circles
        </label>
      </div>

      <button
        type="button"
        onClick={onCopy}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded bg-[#cdf129] px-2 py-1.5 text-[11px] font-bold text-black hover:brightness-105"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Copied' : 'Copy config JSON'}
      </button>
    </div>
  );
}
