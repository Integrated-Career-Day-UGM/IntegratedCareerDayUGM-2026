import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useMapStore } from '../../stores/mapStore';
import { useKpiData } from '../../hooks/map/useKpiData';
import KpiTile from '../../components/map/kpi/KpiTile';
import type { KpiData } from '../../components/map/kpi/KpiTile';
import { ui, booths, sessions, event, companies } from '../../lib/data';

// No captions: the label and the number are the whole message. Empty values
// render as "—" and the tiles stay aligned.
const emptyKpis: KpiData[] = [
  { label: 'Active Openings', value: null, trend: [] },
  { label: 'Most Bookmarked Sector', value: null, trend: [] },
  { label: 'Avg. Response Rate', value: null, trend: [] },
  { label: 'Internships', value: null, trend: [] },
];

/** Swift-Charts-like categorical palette for the sector bars only. */
const SECTOR_COLORS = ['#5b8def', '#4fc3a1', '#f2a65a', '#9b8cff', '#e5657a', '#4fc3d9'];
/** One accent per KPI sparkline, so the bento does not read as one hue. */
const KPI_COLORS = ['#ff2d6f', '#5b8def', '#4fc3a1', '#f2a65a'];

/**
 * Stats view — Swift Charts direction: one panel, hairline-separated cells,
 * big values, small muted labels, one accent (pink) and nothing else. No
 * captions, no card-in-card, no icon decoration.
 */
export default function Insights() {
  const bookmarkedIds = useMapStore((s) => s.bookmarkedIds);
  const { data: kpiData, loading: kpiLoading } = useKpiData();
  const cards = ui.insights.cards;

  const stats = [
    {
      key: 'attendance',
      label: cards.attendance.label,
      value: cards.attendance.value,
      change: cards.attendance.change,
    },
    {
      key: 'companies',
      label: cards.companies.label,
      value: String(booths.filter((b) => b.companyId).length),
    },
    {
      key: 'sessions',
      label: cards.sessions.label,
      value: String(sessions.filter((s) => s.dayId === event.days[0].id).length),
    },
    {
      key: 'bookmarks',
      label: cards.bookmarks.label,
      value: cards.bookmarks.value.replace('{count}', String(bookmarkedIds.length)),
    },
  ];

  const kpis = kpiData?.items && kpiData.items.length > 0 ? kpiData.items : emptyKpis;

  // Tag/sector distribution, memoized: the Insights island only mounts when
  // the Stats tab is opened (after the map has painted), and this single
  // pass over companies runs once per mount — never on hover/selection.
  const tagStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const company of companies) {
      for (const tag of company.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, []);
  const tagMax = tagStats[0]?.[1] ?? 1;

  return (
    <div className="@container reveal-product">
      <div className="section-label mb-2.5 border-b border-[#232326] pb-2">{ui.insights.title}</div>

      {/* Bento: stats and KPI cells share one hairline panel — no nested
          cards, no section label between them. */}
      <div className="grid grid-cols-2 gap-px border border-line bg-[#2a2a2a]">
        {stats.map((stat) => (
          <div key={stat.key} className="bg-[#141416] px-3 py-3">
            <div className="truncate text-[11px] text-[#8f8f8f]">{stat.label}</div>
            <div className="mt-1 flex items-baseline gap-1.5 overflow-hidden">
              <span className="font-heading text-[24px] font-bold leading-none text-white">
                {stat.value}
              </span>
              {stat.change && (
                <span className="text-[11px] font-medium text-[var(--accent-pink)]">
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
        {kpis.map((kpi, index) => (
          <KpiTile
            key={`${kpi.label}-${index}`}
            {...kpi}
            loading={kpiLoading}
            accent={KPI_COLORS[index % KPI_COLORS.length]}
            className="bg-[#141416]"
          />
        ))}
      </div>

      {/* Sectors — horizontal Swift-style bars (no rotated axis labels). */}
      <div className="section-label mt-5 mb-2.5 border-b border-[#232326] pb-2">
        {ui.insights.sectorsLabel}
      </div>
      <div className="panel-list">
        {tagStats.map(([tag, count], index) => (
          <div key={tag} className="flex items-center gap-3 px-3 py-2">
            <span className="w-24 shrink-0 truncate text-[11px] text-ink-body">{tag}</span>
            <span className="h-2 flex-1 bg-[#1f1f23]">
              <motion.span
                className="block h-full"
                initial={{ width: 0, opacity: 0 }}
                animate={{
                  width: `${Math.max(4, Math.round((count / tagMax) * 100))}%`,
                  opacity: 1,
                }}
                transition={{ type: 'spring', duration: 0.16, bounce: 0, delay: index * 0.06 }}
                style={{
                  backgroundColor: SECTOR_COLORS[index % SECTOR_COLORS.length],
                }}
              />
            </span>
            <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-[#8f8f8f]">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
