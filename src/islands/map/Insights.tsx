import { motion } from 'motion/react';
import { useMapStore } from '../../stores/mapStore';
import KpiTile from '../../components/map/kpi/KpiTile';
import type { KpiData } from '../../components/map/kpi/KpiTile';
import InsightsSkeleton from '../../components/map/kpi/InsightsSkeleton';
import { ui, booths, sessions, event, companies, openingsMeta } from '../../lib/data';

/** Swift-Charts-like categorical palette for the sector bars only. */
const SECTOR_COLORS = ['#5b8def', '#4fc3a1', '#f2a65a', '#9b8cff', '#e5657a', '#4fc3d9'];
/** One accent per KPI chart, so the bento does not read as one hue. */
const KPI_COLORS = ['#ff2d6f', '#5b8def', '#4fc3a1', '#f2a65a'];

const whole = (value: number) => String(Math.round(value));

type SectorRow = {
  label: string;
  companies: number;
  internships: number;
  fullTime: number;
};

/**
 * Real visitor-facing facts, grouped by each company's primary sector.
 * The last bucket is "Other" so the chart totals always match the KPI value.
 */
const SECTOR_ROWS: SectorRow[] = (() => {
  const bySector = new Map<string, SectorRow>();
  for (const company of companies) {
    const label = company.tags[0] ?? 'Other';
    const row =
      bySector.get(label) ?? { label, companies: 0, internships: 0, fullTime: 0 };
    row.companies += 1;
    for (const opening of company.openings) {
      if (opening.type === 'Internship') row.internships += 1;
      else row.fullTime += 1;
    }
    bySector.set(label, row);
  }

  const sorted = [...bySector.values()].sort(
    (a, b) => b.internships + b.fullTime - (a.internships + a.fullTime),
  );
  if (sorted.length <= 6) return sorted;

  const other = sorted.slice(5).reduce<SectorRow>(
    (acc, row) => ({
      label: 'Other',
      companies: acc.companies + row.companies,
      internships: acc.internships + row.internships,
      fullTime: acc.fullTime + row.fullTime,
    }),
    { label: 'Other', companies: 0, internships: 0, fullTime: 0 },
  );
  return [...sorted.slice(0, 5), other];
})();

const TOTAL_OPENINGS = SECTOR_ROWS.reduce(
  (total, row) => total + row.internships + row.fullTime,
  0,
);
const INTERNSHIPS = SECTOR_ROWS.reduce((total, row) => total + row.internships, 0);
const FULL_TIME = SECTOR_ROWS.reduce((total, row) => total + row.fullTime, 0);
const HIRING_COMPANIES = new Set(
  booths
    .map((booth) => booth.companyId)
    .filter((id): id is string => Boolean(id)),
).size;

/**
 * Stats view — Swift Charts direction: one panel, hairline-separated cells,
 * big values, small muted labels. Every number is derived from the event
 * data (companies, openings, sessions, bookmarks) — no invented analytics.
 */
export default function Insights({ loading = false }: { loading?: boolean }) {
  const bookmarkedIds = useMapStore((s) => s.bookmarkedIds);
  const selectedDayId = useMapStore((s) => s.selectedDayId);
  const cards = ui.insights.cards;
  const copy = ui.insights.kpi;

  if (loading) return <InsightsSkeleton />;

  const sessionsToday = sessions.filter((s) => s.dayId === selectedDayId).length;

  const stats: (KpiData & { key: string })[] = [
    {
      key: 'companies',
      label: cards.companies.label,
      value: HIRING_COMPANIES,
      format: whole,
      caption: cards.companies.caption,
    },
    {
      key: 'openRoles',
      label: cards.openRoles.label,
      value: TOTAL_OPENINGS,
      format: whole,
      caption: cards.openRoles.caption,
    },
    {
      key: 'sessions',
      label: cards.sessions.label,
      value: sessionsToday,
      format: whole,
      caption: cards.sessions.caption,
    },
    {
      key: 'bookmarks',
      label: cards.bookmarks.label,
      value: bookmarkedIds.length,
      format: whole,
      caption: cards.bookmarks.caption,
    },
  ];

  const walkInsByDay = event.days.map((day) => ({
    label: new Date(`${day.date}T00:00:00Z`).toLocaleDateString(event.locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }),
    value: sessions.filter(
      (s) => s.dayId === day.id && s.trackId === 'walk-in-interview',
    ).length,
  }));
  const walkIns = walkInsByDay.reduce((total, row) => total + row.value, 0);

  const sessionsByTrack = event.tracks
    .map((track) => ({
      label: track.label,
      value: sessions.filter((s) => s.trackId === track.id).length,
    }))
    .filter((row) => row.value > 0);

  const kpis: KpiData[] = [
    {
      label: copy.internships,
      value: INTERNSHIPS,
      format: whole,
      trend: SECTOR_ROWS.map((row) => row.internships),
      trendLabels: SECTOR_ROWS.map((row) => row.label),
      seriesLabel: copy.bySector,
    },
    {
      label: copy.fullTime,
      value: FULL_TIME,
      format: whole,
      trend: SECTOR_ROWS.map((row) => row.fullTime),
      trendLabels: SECTOR_ROWS.map((row) => row.label),
      seriesLabel: copy.bySector,
    },
    {
      label: copy.walkIns,
      value: walkIns,
      format: whole,
      trend: walkInsByDay.map((row) => row.value),
      trendLabels: walkInsByDay.map((row) => row.label),
      seriesLabel: copy.byDay,
    },
    {
      label: copy.sessions,
      value: sessions.length,
      format: whole,
      trend: sessionsByTrack.map((row) => row.value),
      trendLabels: sessionsByTrack.map((row) => row.label),
      seriesLabel: copy.byTrack,
    },
  ];

  const sectorChart = [...SECTOR_ROWS].sort(
    (a, b) =>
      Number(a.label === 'Other') - Number(b.label === 'Other') ||
      b.companies - a.companies,
  );
  const sectorMax = Math.max(...sectorChart.map((row) => row.companies), 1);

  return (
    <div className="@container reveal-product">
      <div className="section-label mb-2.5 border-b border-[#232326] pb-2">
        {ui.insights.title}
      </div>

      {/* Bento: visitor facts and real distributions share one hairline
          panel — no nested cards, no section label between them. */}
      <div className="grid grid-cols-2 gap-px border border-line bg-[#2a2a2a]">
        {stats.map(({ key, ...stat }) => (
          <KpiTile
            key={key}
            {...stat}
            variant="stat"
            className="bg-[#141416]"
          />
        ))}
        {kpis.map((kpi, index) => (
          <KpiTile
            key={kpi.label}
            {...kpi}
            accent={KPI_COLORS[index % KPI_COLORS.length]}
            className="bg-[#141416]"
          />
        ))}
      </div>
      {TOTAL_OPENINGS === 0 && (
        <p className="mt-2 text-[10.5px] text-[#8f8f8f]">
          {openingsMeta.status === 'unavailable'
            ? ui.boothDetail.openingsUnavailableTitle
            : ui.boothDetail.openingsEmptyTitle}
        </p>
      )}

      {/* Companies per sector — one flat chart; no dividers between rows. */}
      <div className="section-label mt-5 mb-2.5">{ui.insights.sectorsLabel}</div>
      <div className="panel-list p-2">
        <div className="space-y-1.5">
          {sectorChart.map((row, index) => (
            <div key={row.label} className="flex items-center gap-3 px-1 py-1">
              <span className="w-24 shrink-0 truncate text-[11px] text-ink-body">
                {row.label}
              </span>
              <span className="h-2 flex-1 bg-[#1f1f23]">
                <motion.span
                  className="block h-full"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{
                    width: `${Math.max(4, Math.round((row.companies / sectorMax) * 100))}%`,
                    opacity: 1,
                  }}
                  transition={{
                    type: 'spring',
                    duration: 0.16,
                    bounce: 0,
                    delay: index * 0.06,
                  }}
                  style={{ backgroundColor: SECTOR_COLORS[index % SECTOR_COLORS.length] }}
                />
              </span>
              <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-[#8f8f8f]">
                {row.companies}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
