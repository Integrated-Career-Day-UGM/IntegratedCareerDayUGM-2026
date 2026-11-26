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
import { surfaceClasses } from '../../lib/surface-classes';

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
          className="relative mt-2 hidden w-fit max-w-full grid-cols-2 items-center justify-start gap-1.5 md:grid"
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
                  'group relative flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-[#34343a] py-1 pl-1 pr-3.5 text-[0.8125rem] font-semibold text-white transition-colors',
                  surfaceClasses(3, 3),
                  disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'active:scale-[0.98] hover:border-[#4a4a52]',
                )}
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-white',
                    surfaceClasses(5, 5),
                  )}
                >
                  <Icon
                    size={14}
                    strokeWidth={1.6}
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                  />
                </span>
                <span
                  className={cn(
                    'transition-colors',
                    disabled ? 'text-[#6b6b70]' : 'text-white',
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
            className={cn(
              'relative z-20 flex size-11 items-center justify-center rounded-full border border-[#34343a] text-white transition-[transform,colors] active:scale-95',
              surfaceClasses(4, 4),
            )}
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
                      animate={{ opacity: disabled ? 0.5 : 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.16, ease: 'easeOut', delay: index * 0.03 }}
                      disabled={disabled}
                      aria-disabled={disabled || undefined}
                      aria-label={label}
                      title={label}
                      onClick={() => {
                        if (disabled) return;
                        track('facility.click', { facilityId: item.id, label: item.label });
                        setOpen(false);
                        openFacility(item.id);
                      }}
                      className={cn(
                        'flex min-h-10 items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 font-heading text-[0.75rem] font-bold shadow-lg transition-colors',
                        surfaceClasses(3, 3),
                        disabled
                          ? 'cursor-not-allowed border-[#333338]'
                          : 'border-[#34343a] text-white active:scale-95',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full text-white',
                          surfaceClasses(5, 5),
                        )}
                      >
                        <Icon
                          size={15}
                          strokeWidth={1.7}
                          fill="currentColor"
                          className="h-3.5 w-3.5"
                        />
                      </span>
                      <span className={disabled ? 'text-[#6b6b70]' : 'text-white'}>
                        {label}
                      </span>
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
