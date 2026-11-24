import { companies, ui } from '@/lib/data';
import { useMapStore } from '@/stores/mapStore';

/** Facet options are derived once at module load — never per render. */
const SECTOR_OPTIONS = [...new Set(companies.flatMap((c) => c.tags))].sort((a, b) =>
  a.localeCompare(b),
);

const ROLE_OPTIONS = [...new Set(companies.flatMap((c) => c.openings.map((o) => o.type)))].sort(
  (a, b) => a.localeCompare(b),
);

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-1.5 py-0.5 text-[10.5px] font-medium transition-colors active:scale-[0.98] ${
        active
          ? 'border-[var(--accent-pink)] bg-(--accent-pink)/15 text-white'
          : 'border-line text-[#d4d4d8] hover:bg-[#1f1f23]'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Search facets: sector (company tags) and role type (opening types).
 * Rendered inside the origin-aware popover in SearchBar; keyboard focus is
 * moved into it on open and returned to the trigger on close.
 */
export default function SearchFilters() {
  const filters = useMapStore((s) => s.searchFilters);
  const toggleSearchFilter = useMapStore((s) => s.toggleSearchFilter);
  const clearSearchFilters = useMapStore((s) => s.clearSearchFilters);

  const activeCount = filters.tags.length + filters.types.length;

  return (
    <div
      role="dialog"
      aria-label={ui.search.filters.title}
      className="max-h-[60vh] overflow-auto border border-line bg-[#141416] p-2.5 text-left"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="section-label">{ui.search.filters.title}</span>
        <button
          type="button"
          onClick={clearSearchFilters}
          disabled={activeCount === 0}
          className="text-[10.5px] text-ink-dim transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-40"
        >
          {ui.search.filters.clear}
        </button>
      </div>

      <fieldset className="mt-2.5">
        <legend className="section-label mb-1.5">{ui.search.filters.sector}</legend>
        <div className="flex flex-wrap gap-1">
          {SECTOR_OPTIONS.map((sector) => (
            <FilterChip
              key={sector}
              label={sector}
              active={filters.tags.includes(sector)}
              onClick={() => toggleSearchFilter('tags', sector)}
            />
          ))}
        </div>
      </fieldset>

      {ROLE_OPTIONS.length > 0 && (
        <fieldset className="mt-2.5">
          <legend className="section-label mb-1.5">{ui.search.filters.role}</legend>
          <div className="flex flex-wrap gap-1">
            {ROLE_OPTIONS.map((role) => (
              <FilterChip
                key={role}
                label={role}
                active={filters.types.includes(role)}
                onClick={() => toggleSearchFilter('types', role)}
              />
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
