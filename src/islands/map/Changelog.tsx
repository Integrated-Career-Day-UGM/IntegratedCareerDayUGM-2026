import { ChevronLeft } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { changelog } from '../../lib/data';
import ChangelogStepper from '../../components/map/ChangelogStepper';
import ProfileCard from '../../components/map/ProfileCard';

/**
 * Changelog page. Rendered inside the sidebar / tray as a page (not a modal),
 * so the tab rail and the map stay alive; `Kembali` restores the origin tab.
 */
export default function Changelog() {
  const closeChangelog = useMapStore((s) => s.closeChangelog);

  return (
    <div>
      <div className="mb-3 flex items-center border-b border-[#232326] pb-2">
        <button
          type="button"
          onClick={closeChangelog}
          className="flex h-8 shrink-0 items-center gap-1 text-[0.75rem] font-semibold text-[#a1a1aa] transition-colors hover:text-white"
        >
          <ChevronLeft size={16} strokeWidth={2} />
          Kembali
        </button>
      </div>

      <div className="rounded-[4px] bg-surface-2 p-3">
        <ChangelogStepper entries={changelog} />
      </div>

      <div className="mt-3">
        <ProfileCard />
      </div>
    </div>
  );
}
