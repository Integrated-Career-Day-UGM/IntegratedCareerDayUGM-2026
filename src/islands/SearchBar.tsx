import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
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
    <div className="relative h-[42px] rounded-2xl border-[3px] border-[#6a6a6a]/80 bg-[#444]/80 sm:rounded-none sm:border-[#6a6a6a] sm:bg-[#444]">
      <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#bbb]">
        <Search size={20} strokeWidth={1.8} />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setSidebarTab('search')}
        placeholder={ui.search.placeholder}
        className="h-full w-full bg-transparent pl-10 pr-20 text-[15px] text-white placeholder-[#bbb] outline-none"
      />
      {searchQuery ? (
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-[#bbb] transition-colors hover:text-white"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      ) : (
        <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
          <kbd className="bg-[#666] px-1.5 py-0.5 font-heading text-[10px] font-semibold text-[#ddd]">
            {ui.search.shortcutHint}
          </kbd>
          <kbd className="bg-[#666] px-1.5 py-0.5 font-heading text-[10px] font-semibold text-[#ddd]">
            {ui.search.shortcutKey}
          </kbd>
        </div>
      )}
    </div>
  );
}
