import { useEffect, useRef } from 'react';
import { Toilet, MoonStar, LifeBuoy, LogOut, DoorOpen, Info } from 'lucide-react';
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
  // Prayer room reads at a glance as a crescent; the old bespoke mosque
  // outline was noisy at 12px.
  mosque: MoonStar,
  // Help Desk: a life ring says "someone can help you" better than a hand.
  hand: LifeBuoy,
  'log-out': LogOut,
  'door-open': DoorOpen,
  info: Info,
};

// One-key shortcuts for the first three items (ignored while typing).
const shortcutKeys = ['T', 'M', 'H'];
// Copy is not ready for these yet; keep the chips visible but inert.
const DISABLED_FACILITY_IDS = new Set(['mushola', 'pusat-bantuan']);

const openFacility = (id: string) => {
  const store = useMapStore.getState();
  store.selectFacility(id);
  store.openMobileSheet();
};

export default function QuickFind() {
  const visible = quickfind.slice(0, 3);
  // Gliding hover highlight across the chips (§0). Hit-testing is exact
  // containment (no `nearest`), so the wrapping row needs no axis hint.
  const chipsRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(chipsRef);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const key = e.key.toUpperCase();
      const item = visible[shortcutKeys.indexOf(key)];
      if (item && !DISABLED_FACILITY_IDS.has(item.id)) {
        track('facility.click', { facilityId: item.id, label: item.label, via: 'keyboard' });
        openFacility(item.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible]);

  return (
    <MapFluidRoot>
      <div
        ref={chipsRef}
        className="relative flex w-max max-w-[15rem] flex-wrap items-center justify-start gap-2 md:max-w-full md:gap-1.5"
        {...hover.handlers}
      >
        {/* Gliding fill behind the chips (user preference over the ring). */}
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
                'group relative flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-[0.75rem] font-semibold transition-colors md:min-h-7 md:gap-1.5 md:px-2.5 md:py-0 md:text-[0.6875rem]',
                disabled
                  ? 'cursor-not-allowed border-[#3a3a3a] bg-[#222225] text-[#6b6b70] opacity-55'
                  : 'border-[#4a4a4a] bg-[#2a2a2a] text-ink-body active:scale-[0.98] md:hover:border-[var(--accent-pink)]',
              )}
            >
              <Icon
                size={14}
                strokeWidth={1.5}
                fill="currentColor"
                className="h-3.5 w-3.5 shrink-0 md:h-2.5 md:w-2.5"
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
    </MapFluidRoot>
  );
}
