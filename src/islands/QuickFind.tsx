import { useEffect } from 'react';
import { Toilet, Hand, CircleHelp, LogOut, DoorOpen, Info } from 'lucide-react';
import { track } from '../lib/analytics';
import { quickfind, ui } from '../lib/data';

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
> = {
  toilet: Toilet,
  mosque: ({ size, className }: { size?: number; className?: string }) => (
    <svg
      width={size ?? 16}
      height={size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M4 20h16M6 20V8l6-4 6 4v12M6 8h12M9 20v-6h6v6" />
    </svg>
  ),
  hand: Hand,
  'log-out': LogOut,
  'door-open': DoorOpen,
  info: Info,
};

// One-key shortcuts for the first three items (ignored while typing).
const shortcutKeys = ['T', 'M', 'H'];

export default function QuickFind() {
  const visible = quickfind.slice(0, 3);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const key = e.key.toUpperCase();
      const item = visible[shortcutKeys.indexOf(key)];
      if (item) {
        track('facility.click', { facilityId: item.id, label: item.label, via: 'keyboard' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible]);

  return (
    <div className="flex w-max max-w-[15rem] flex-wrap items-center justify-start gap-1 sm:max-w-full sm:gap-0.5">
      {visible.map((item, i) => {
        const Icon = iconMap[item.icon] ?? Info;
        const label = ui.quickFind.items[item.id] ?? item.label;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => track('facility.click', { facilityId: item.id, label: item.label })}
            className="flex h-6 shrink-0 items-center gap-1 rounded-full border border-[#5a5a5a] bg-[#414141]/90 px-1.5 text-[10px] font-semibold text-[#ededed] transition-colors hover:bg-[#4d4d4d] active:scale-[0.98] sm:h-[33px] sm:gap-[7px] sm:rounded-md sm:border-[#5a5a5a] sm:bg-[#414141] sm:px-[10px] sm:text-[12px]"
          >
            <span className="flex h-[11px] w-[11px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-current sm:h-[14px] sm:w-[14px]">
              <Icon size={7} strokeWidth={2.5} className="sm:hidden" />
              <Icon size={8} strokeWidth={2.5} className="hidden sm:block" />
            </span>
            {label}
            <kbd className="hidden border border-[#575757] px-1 py-px font-heading text-[9px] font-semibold text-[#cfcfcf] sm:inline-block">
              {shortcutKeys[i]}
            </kbd>
          </button>
        );
      })}
    </div>
  );
}
