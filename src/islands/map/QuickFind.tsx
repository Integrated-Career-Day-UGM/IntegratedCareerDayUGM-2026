import { useEffect, useRef, useState } from 'react';
import { Toilet, MoonStar, LifeBuoy, LogOut, DoorOpen, Info, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { track } from '../../lib/analytics';
import { useMapStore } from '../../stores/mapStore';
import { useFluidHover } from '../../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
import { MapFluidRoot } from '../../components/map/map-fluid-root';
import { quickfind, ui } from '../../lib/data';
import { cn } from '../../lib/utils/cn';

const iconMap: Record<
  string,
  React.ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
    fill?: string;
  }>
> = {
  toilet: Toilet,
  mosque: MoonStar,
  hand: LifeBuoy,
  'log-out': LogOut,
  'door-open': DoorOpen,
  info: Info,
};

// One-key shortcuts for the first three items (ignored while typing).
const shortcutKeys = ['T', 'M', 'H'];
const DISABLED_FACILITY_IDS = new Set(['mushola', 'pusat-bantuan']);

const openFacility = (id: string) => {
  useMapStore.getState().selectFacility(id);
};

export default function QuickFind() {
  const visible = quickfind.slice(0, 3);
  const chipsRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(chipsRef);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const key = e.key.toUpperCase();
      if (key === 'ESCAPE') setOpen(false);
      const item = visible[shortcutKeys.indexOf(key)];
      if (item && !DISABLED_FACILITY_IDS.has(item.id)) {
        track('facility.click', { facilityId: item.id, label: item.label, via: 'keyboard' });
        openFacility(item.id);
      }
    };
    const onClick = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onClick);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onClick);
    };
  }, [visible]);

  return (
    <MapFluidRoot>
      <div ref={rootRef} className="relative">
        {/* Desktop keeps the labelled chip row. */}
        <div
          ref={chipsRef}
          className="relative hidden w-max max-w-full flex-wrap items-center justify-start gap-1.5 md:flex"
          {...hover.handlers}
        >
          <FluidHoverHighlight hover={hover} className="bg-field-hover rounded-full" />
          {visible.map((item, i) => {
            const Icon = iconMap[item.icon] ?? Info;
            const label = ui.quickFind.items[item.id] ?? item.label;
            const disabled = DISABLED_FACILITY_IDS.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                ref={(el) => hover.registerItem(i, disabled ? null : el)}
                onFocus={() => {
                  if (!disabled) hover.setActiveIndex(i);
                }}
                disabled={disabled}
                aria-disabled={disabled || undefined}
                onClick={() => {
                  if (disabled) return;
                  track('facility.click', { facilityId: item.id, label: item.label });
                  openFacility(item.id);
                }}
                className={cn(
                  'group relative flex min-h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0 text-[0.6875rem] font-semibold transition-colors',
                  disabled
                    ? 'cursor-not-allowed border-[#3a3a3a] bg-[#222225] text-[#6b6b70] opacity-55'
                    : 'border-[#4a4a4a] bg-[#2a2a2a] text-ink-body active:scale-[0.98] md:hover:border-[var(--accent-pink)]',
                )}
              >
                <Icon
                  size={14}
                  strokeWidth={1.5}
                  fill="currentColor"
                  className="h-2.5 w-2.5 shrink-0"
                />
                <span
                  className={cn(
                    'transition-colors',
                    disabled
                      ? 'text-[#6b6b70]'
                      : 'text-[#d4d4d8]/65 group-hover:text-[#d4d4d8]',
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile: one FAB; actions fan down from it. */}
        <div className="relative md:hidden">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={ui.quickFind.title}
            aria-expanded={open}
            className="relative z-20 flex size-11 items-center justify-center rounded-full border border-[#4a4a4a] bg-[#2a2a2a] text-white shadow-lg transition-[transform,colors] active:scale-95"
          >
            <Plus
              size={19}
              strokeWidth={2}
              className={cn(
                'transition-transform duration-200',
                open ? 'rotate-45' : 'rotate-0',
              )}
            />
          </button>

          <AnimatePresence>
            {open && (
              <div className="absolute left-0 top-full z-10 mt-2 flex flex-col gap-2">
                {visible.map((item, index) => {
                  const Icon = iconMap[item.icon] ?? Info;
                  const label = ui.quickFind.items[item.id] ?? item.label;
                  const disabled = DISABLED_FACILITY_IDS.has(item.id);
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={{ opacity: 0, y: -6, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.16, ease: 'easeOut', delay: index * 0.03 }}
                      disabled={disabled}
                      aria-label={label}
                      title={label}
                      onClick={() => {
                        if (disabled) return;
                        track('facility.click', { facilityId: item.id, label: item.label });
                        setOpen(false);
                        openFacility(item.id);
                      }}
                      className={cn(
                        'flex size-11 items-center justify-center rounded-full border shadow-lg transition-colors',
                        disabled
                          ? 'cursor-not-allowed border-[#333338] bg-[#1c1c20] text-[#5f5f66] opacity-60'
                          : 'border-[#4a4a4a] bg-[#2a2a2a] text-white active:scale-95',
                      )}
                    >
                      <Icon size={17} strokeWidth={1.7} />
                    </motion.button>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MapFluidRoot>
  );
}
