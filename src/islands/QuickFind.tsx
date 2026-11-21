import { Toilet, Hand, CircleHelp, LogOut, DoorOpen, Info } from 'lucide-react';
import { track } from '../lib/analytics';
import { quickfind, ui } from '../lib/data';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
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

export default function QuickFind() {
  const visible = quickfind.slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="sidebar-section-title">{ui.quickFind.title}</div>
      <div className="flex flex-wrap gap-2">
        {visible.map((item) => {
          const Icon = iconMap[item.icon] ?? Info;
          const label = ui.quickFind.items[item.id] ?? item.label;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => track('facility.click', { facilityId: item.id, label: item.label })}
              className="inline-flex items-center gap-2 bg-[#4a4a4a] px-3 py-2 text-[15px] font-semibold text-white transition-colors hover:bg-[#555] active:scale-[0.98]"
            >
              <span className="h-[11px] w-[11px] rounded-full border-2 border-current" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
