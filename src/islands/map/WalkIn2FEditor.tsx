import { useRef, useState } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { FRAME_HEIGHT, FRAME_WIDTH, WALKIN_2F } from '../../lib/map/floorplan';

const SCALE = 0.55;
const round = (value: number) => Math.round(value * 10) / 10;

type Selection =
  | { kind: 'hull' }
  | { kind: 'room'; id: string }
  | { kind: 'sign'; id: string }
  | { kind: 'decor'; id: string };

type Drag = {
  kind: Selection['kind'];
  id?: string;
  startX: number;
  startY: number;
  left: number;
  top: number;
  unit: number;
};

/**
 * Walk-in 2F tab inside the DEV geometry editor. Same interaction language as
 * the first-floor tab: click to select, drag to move, type exact values.
 */
export default function WalkIn2FEditor() {
  const config = useMapStore((s) => s.walkIn2FConfig);
  const setConfig = useMapStore((s) => s.setWalkIn2FConfig);
  const decor = config.decor ?? WALKIN_2F.decor ?? [];
  const [selection, setSelection] = useState<Selection | null>(null);
  const dragRef = useRef<Drag | null>(null);

  const startDrag = (
    event: React.PointerEvent<HTMLElement>,
    next: Selection,
    left: number,
    top: number,
    unit = 1,
  ) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelection(next);
    dragRef.current = {
      kind: next.kind,
      id: 'id' in next ? next.id : undefined,
      startX: event.clientX,
      startY: event.clientY,
      left,
      top,
      unit,
    };
  };

  const handleMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (event.clientX - drag.startX) / SCALE / drag.unit;
    const dy = (event.clientY - drag.startY) / SCALE / drag.unit;
    const left = round(drag.left + dx);
    const top = round(drag.top + dy);

    if (drag.kind === 'hull') {
      setConfig({ ...config, hull: { ...config.hull, left, top } });
      return;
    }
    if (drag.kind === 'room' && drag.id) {
      setConfig({
        ...config,
        rooms: config.rooms.map((room) =>
          room.id === drag.id ? { ...room, left, top } : room,
        ),
      });
      return;
    }
    if (drag.kind === 'sign' && drag.id) {
      setConfig({
        ...config,
        signs: config.signs.map((sign) =>
          sign.id === drag.id ? { ...sign, left, top } : sign,
        ),
      });
      return;
    }
    if (drag.kind === 'decor' && drag.id) {
      setConfig({
        ...config,
        decor: decor.map((item) =>
          item.id === drag.id ? { ...item, left, top } : item,
        ),
      });
    }
  };

  const handleUp = () => {
    dragRef.current = null;
  };

  const setHull = (key: keyof typeof config.hull, value: number) =>
    setConfig({ ...config, hull: { ...config.hull, [key]: value } });
  const setContent = (key: keyof typeof config.content, value: number) =>
    setConfig({ ...config, content: { ...config.content, [key]: value } });

  const updateRoom = (id: string, key: string, value: number) =>
    setConfig({
      ...config,
      rooms: config.rooms.map((room) =>
        room.id === id ? { ...room, [key]: value } : room,
      ),
    });
  const updateSign = (id: string, key: string, value: number) =>
    setConfig({
      ...config,
      signs: config.signs.map((sign) =>
        sign.id === id ? { ...sign, [key]: value } : sign,
      ),
    });
  const updateDecor = (id: string, key: string, value: number) =>
    setConfig({
      ...config,
      decor: decor.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    });

  const field = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    step = 0.1,
  ) => (
    <label key={label} className="flex items-center justify-between gap-2">
      <span className="text-[#8f8f8f]">{label}</span>
      <input
        type="number"
        step={step}
        value={Number(value.toFixed(2))}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-24 border border-[#34343a] bg-[#141416] px-1 py-0.5 text-right text-white"
      />
    </label>
  );

  const rotateButtons = (value: number, onChange: (value: number) => void) => (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onChange(round(value - 15))}
        className="flex-1 border border-[#34343a] px-1 py-1 text-white hover:bg-[#1f1f23]"
      >
        −15°
      </button>
      <button
        type="button"
        onClick={() => onChange(round(value + 15))}
        className="flex-1 border border-[#34343a] px-1 py-1 text-white hover:bg-[#1f1f23]"
      >
        +15°
      </button>
    </div>
  );

  const selectedRoom =
    selection?.kind === 'room'
      ? config.rooms.find((room) => room.id === selection.id)
      : undefined;
  const selectedSign =
    selection?.kind === 'sign'
      ? config.signs.find((sign) => sign.id === selection.id)
      : undefined;
  const selectedDecor =
    selection?.kind === 'decor'
      ? decor.find((item) => item.id === selection.id)
      : undefined;

  return (
    <div className="flex min-h-0 flex-1 overflow-auto">
      <div className="flex-1 overflow-auto p-4">
        <div
          className="relative"
          style={{
            width: FRAME_WIDTH * SCALE,
            height: FRAME_HEIGHT * SCALE,
            background: '#17171a',
            outline: '1px solid #34343a',
          }}
        >
          <div
            className="relative"
            style={{
              width: FRAME_WIDTH,
              height: FRAME_HEIGHT,
              transform: `scale(${SCALE})`,
              transformOrigin: '0 0',
              background: '#e8e4da',
            }}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={handleUp}
          >
            <div
              className="absolute cursor-move"
              onPointerDown={(event) =>
                startDrag(event, { kind: 'hull' }, config.hull.left, config.hull.top)
              }
              style={{
                left: config.hull.left,
                top: config.hull.top,
                width: config.hull.w,
                height: config.hull.h,
                transform: `rotate(${config.hull.rotate}deg)`,
                transformOrigin: 'center',
                outline:
                  selection?.kind === 'hull' ? '2px solid #ff2d6f' : undefined,
                zIndex: 1,
              }}
            >
              <img
                src="/maps/assets/walk-in-2f-hull.svg"
                alt=""
                className="pointer-events-none absolute inset-0 size-full max-w-none"
                draggable={false}
              />
              {decor.map((item) => {
                const active = selection?.kind === 'decor' && selection.id === item.id;
                return (
                  <img
                    key={item.id}
                    src={item.src}
                    alt={item.label}
                    draggable={false}
                    onPointerDown={(event) =>
                      startDrag(
                        event,
                        { kind: 'decor', id: item.id },
                        item.left,
                        item.top,
                      )
                    }
                    className="absolute max-w-none cursor-move"
                    style={{
                      left: item.left,
                      top: item.top,
                      width: item.w,
                      height: item.h,
                      transform: `rotate(${item.rotate}deg)`,
                      transformOrigin: 'center',
                      outline: active ? '2px solid #ff2d6f' : undefined,
                      zIndex: 2,
                    }}
                  />
                );
              })}
              {config.rooms.map((room) => {
                const active = selection?.kind === 'room' && selection.id === room.id;
                return (
                  <div
                    key={room.id}
                    className="absolute flex cursor-move items-center justify-center border border-black/30 bg-[#6d6a16] font-mono text-[11px] font-bold text-white"
                    onPointerDown={(event) =>
                      startDrag(
                        event,
                        { kind: 'room', id: room.id },
                        room.left,
                        room.top,
                        config.content.scale,
                      )
                    }
                    style={{
                      left: config.content.left + room.left * config.content.scale,
                      top: config.content.top + room.top * config.content.scale,
                      width: room.w * config.content.scale,
                      height: room.h * config.content.scale,
                      transform: `rotate(${room.rotate}deg)`,
                      outline: active ? '2px solid #ff2d6f' : undefined,
                      zIndex: 2,
                    }}
                  >
                    {room.id}
                  </div>
                );
              })}
              {config.signs.map((sign) => {
                const active = selection?.kind === 'sign' && selection.id === sign.id;
                return (
                  <div
                    key={sign.id}
                    className={`absolute flex cursor-move items-center justify-center text-[9px] font-bold uppercase text-white ${
                      sign.id === 'exit' ? 'bg-[#f21f1f]' : 'bg-[#1fe21f]'
                    }`}
                    onPointerDown={(event) =>
                      startDrag(
                        event,
                        { kind: 'sign', id: sign.id },
                        sign.left,
                        sign.top,
                      )
                    }
                    style={{
                      left: sign.left,
                      top: sign.top,
                      width: sign.w,
                      height: sign.h,
                      transform: `rotate(${sign.rotate}deg)`,
                      outline: active ? '2px solid #ff2d6f' : undefined,
                      zIndex: 3,
                    }}
                  >
                    {sign.id}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="w-64 shrink-0 overflow-auto border-l border-[#34343a] p-3 font-mono text-[10px]">
        <div className="mb-2 text-[#8f8f8f]">Selection</div>
        <div className="mb-2 text-[9px] text-[#6b7280]">
          Click the hull, a room, or an entrance/exit sign, then drag it or type
          exact values.
        </div>

        {selection?.kind === 'hull' && (
          <div className="space-y-2">
            <div className="text-[9px] text-[#6b7280]">
              Moving the hull moves the room grid and signs with it.
            </div>
            {field('left', config.hull.left, (value) => setHull('left', value))}
            {field('top', config.hull.top, (value) => setHull('top', value))}
            {field('width', config.hull.w, (value) => setHull('w', value))}
            {field('height', config.hull.h, (value) => setHull('h', value))}
            {field('rotate', config.hull.rotate, (value) => setHull('rotate', value))}
            {rotateButtons(config.hull.rotate, (value) => setHull('rotate', value))}
          </div>
        )}

        {selectedRoom && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-white">{selectedRoom.id}</div>
            {(['left', 'top', 'w', 'h', 'rotate'] as const).map((key) =>
              field(key, selectedRoom[key], (value) =>
                updateRoom(selectedRoom.id, key, value),
              ),
            )}
            {rotateButtons(selectedRoom.rotate, (value) =>
              updateRoom(selectedRoom.id, 'rotate', value),
            )}
          </div>
        )}

        {selectedSign && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase text-white">
              {selectedSign.id}
            </div>
            {(['left', 'top', 'w', 'h', 'rotate'] as const).map((key) =>
              field(key, selectedSign[key], (value) =>
                updateSign(selectedSign.id, key, value),
              ),
            )}
            {rotateButtons(selectedSign.rotate, (value) =>
              updateSign(selectedSign.id, 'rotate', value),
            )}
          </div>
        )}

        {selectedDecor && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-white">
              {selectedDecor.label}
            </div>
            {(['left', 'top', 'w', 'h', 'rotate'] as const).map((key) =>
              field(key, selectedDecor[key], (value) =>
                updateDecor(selectedDecor.id, key, value),
              ),
            )}
            {rotateButtons(selectedDecor.rotate, (value) =>
              updateDecor(selectedDecor.id, 'rotate', value),
            )}
          </div>
        )}

        {!selection && (
          <div className="text-[#8f8f8f]">Select an item on the canvas.</div>
        )}

        <div className="mt-3 border-t border-[#34343a] pt-2">
          <div className="mb-1 text-[9px] uppercase tracking-[0.12em] text-[#8f8f8f]">
            Room grid offset
          </div>
          {field('left', config.content.left, (value) => setContent('left', value))}
          {field('top', config.content.top, (value) => setContent('top', value))}
          {field('scale', config.content.scale, (value) => setContent('scale', value), 0.01)}
        </div>

        <button
          type="button"
          onClick={() =>
            navigator.clipboard
              ?.writeText(JSON.stringify(config, null, 2))
              .catch(() => {})
          }
          className="mt-3 w-full border border-[#ff2d6f] bg-[#ff2d6f] px-2 py-2 text-[11px] font-bold text-white"
        >
          Copy 2F JSON
        </button>
      </div>
    </div>
  );
}
