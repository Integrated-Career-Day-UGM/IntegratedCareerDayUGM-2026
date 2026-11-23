import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { KeyCaps } from '../lib/key-cap';
import { MapFluidRoot } from '../components/map/map-fluid-root';
import { ui } from '../lib/data';

export default function SearchBar() {
  const searchQuery = useMapStore((s) => s.searchQuery);
  const setSearchQuery = useMapStore((s) => s.setSearchQuery);
  const setSidebarTab = useMapStore((s) => s.setSidebarTab);
  const inputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcut(
    'k',
    () => {
      inputRef.current?.focus();
      setSidebarTab('search');
    },
    { ctrl: true, preventDefault: true }
  );

  return (
    <MapFluidRoot>
      <div className="relative h-[42px] rounded-2xl border-[3px] border-[#6a6a6a]/80 bg-field/80 md:rounded-none md:border-[#6a6a6a] md:bg-field">
        <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#d4d4d8]">
          <Search size={20} strokeWidth={1.8} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSidebarTab('search')}
          placeholder={ui.search.placeholder}
          className="h-full w-full bg-transparent pl-10 pr-20 text-[15px] text-white placeholder-[#d4d4d8] outline-none"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-[#d4d4d8] transition-colors hover:text-white"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : (
          <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            {/* FF KeyCaps, default tone: FF's `inverted` assumes a LIGHT
                theme background — on dark granite the default cap is the
                "on dark" one (recorded in PRODUCT.md). */}
            <KeyCaps keys={ui.search.shortcutHint} />
            <KeyCaps keys={ui.search.shortcutKey} />
          </div>
        )}
      </div>
    </MapFluidRoot>
  );
}
