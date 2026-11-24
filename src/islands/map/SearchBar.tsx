import { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMapStore } from '../../stores/mapStore';
import { useKeyboardShortcut } from '../../hooks/map/useKeyboardShortcut';
import { KeyCaps } from '../../lib/key-cap';
import { spring } from '../../lib/springs';
import { MapFluidRoot } from '../../components/map/map-fluid-root';
import SearchFilters from '../../components/map/SearchFilters';
import { ui } from '../../lib/data';

export default function SearchBar() {
  const searchQuery = useMapStore((s) => s.searchQuery);
  const setSearchQuery = useMapStore((s) => s.setSearchQuery);
  const setSidebarTab = useMapStore((s) => s.setSidebarTab);
  const activeFilterCount = useMapStore(
    (s) => s.searchFilters.tags.length + s.searchFilters.types.length,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Origin-aware filter popover: anchored to the trigger, closes on outside
  // click / Esc, focus enters the panel and returns to the button.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterWrapRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  useKeyboardShortcut(
    'k',
    () => {
      inputRef.current?.focus();
      setSidebarTab('search');
    },
    { ctrl: true, preventDefault: true }
  );

  // Rail / sheet "Search" is a view switch: focus the visible field so the
  // click lands in an actual search state (the hidden instance ignores it).
  useEffect(() => {
    const onFocusRequest = () => {
      const el = inputRef.current;
      if (!el || el.offsetParent === null) return;
      el.focus();
      setSidebarTab('search');
    };
    window.addEventListener('icd:focus-search', onFocusRequest);
    return () => window.removeEventListener('icd:focus-search', onFocusRequest);
  }, [setSidebarTab]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!filterWrapRef.current?.contains(e.target as Node)) setFiltersOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFiltersOpen(false);
        filterButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [filtersOpen]);

  useEffect(() => {
    if (!filtersOpen) return;
    const first = filterWrapRef.current?.querySelector<HTMLElement>(
      '[role="dialog"] button:not([disabled])',
    );
    first?.focus();
  }, [filtersOpen]);

  return (
    <MapFluidRoot>
      <div className="flex items-center gap-2">
        <div className="relative h-[42px] flex-1 rounded-2xl border-[3px] border-[#6a6a6a]/80 bg-[#2a2a2a]/40 backdrop-blur-md md:h-8 md:rounded-none md:border md:border-[#6a6a6a]/60 md:bg-field/30 md:backdrop-blur-none">
          <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#d4d4d8] md:left-2.5">
            <Search size={16} strokeWidth={1.8} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSidebarTab('search')}
            placeholder={ui.search.placeholder}
            className="search-input h-full w-full bg-transparent pl-10 pr-20 text-[15px] text-white placeholder-[#d4d4d8] outline-none md:pl-9 md:pr-16 md:text-[13px]"
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

        <div ref={filterWrapRef} className="relative z-40 shrink-0">
          <button
            type="button"
            ref={filterButtonRef}
            onClick={() => {
              setSidebarTab('search');
              setFiltersOpen((open) => !open);
            }}
            aria-label={ui.search.filters.trigger}
            aria-expanded={filtersOpen}
            aria-haspopup="dialog"
            className={`relative flex h-[42px] w-[42px] items-center justify-center rounded-2xl border-[3px] border-[#6a6a6a]/80 bg-[#2a2a2a]/40 text-[#d4d4d8] backdrop-blur-md transition-colors md:h-8 md:w-8 md:rounded-none md:border md:border-[#6a6a6a]/60 md:bg-field/30 md:backdrop-blur-none ${
              filtersOpen || activeFilterCount > 0
                ? 'text-white md:border-[var(--accent-pink)]/60 md:bg-[#26262b]'
                : 'md:hover:bg-[#26262b] md:hover:text-white'
            }`}
          >
            <SlidersHorizontal size={15} />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center bg-[var(--accent-pink)] text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                key="search-filters"
                className="absolute right-0 top-full z-[80] mt-2 w-[220px] origin-top-right md:w-[240px]"
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, transition: spring.fast.exit }}
                transition={spring.moderate}
              >
                <SearchFilters />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MapFluidRoot>
  );
}
