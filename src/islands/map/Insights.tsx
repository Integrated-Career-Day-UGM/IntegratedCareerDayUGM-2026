import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useMapStore } from '../../stores/mapStore';
import KpiTile from '../../components/map/kpi/KpiTile';
import type { KpiData } from '../../components/map/kpi/KpiTile';
import TopTile from '../../components/map/kpi/TopTile';
import InsightsSkeleton from '../../components/map/kpi/InsightsSkeleton';
import {
  ui,
  booths,
  sessions,
  event,
  companies,
  careerFairMeta,
  getTrack,
} from '../../lib/data';

/** Swift-Charts-like categorical palette for the sector bars only. */
const SECTOR_COLORS = ['#5b8def', '#4fc3a1', '#f2a65a', '#9b8cff', '#e5657a', '#4fc3d9'];
/** One accent per remaining KPI chart. */
const KPI_COLORS = ['#ff2d6f', '#5b8def'];

const whole = (value: number) => String(Math.round(value));

type SectorRow = {
  label: string;
  companies: number;
};

/**
 * Real visitor-facing facts, grouped by each company's primary sector.
 * Everything outside the five biggest sectors is merged into one "Other"
 * bucket, so the chart totals always match the KPI value and no label repeats.
 */
const SECTOR_ROWS: SectorRow[] = (() => {
  const bySector = new Map<string, SectorRow>();
  for (const company of companies) {
    const label = company.tags[0]?.trim() || 'Other';
    const row = bySector.get(label) ?? { label, companies: 0 };
    row.companies += 1;
    bySector.set(label, row);
  }

  const sorted = [...bySector.values()].sort(
    (a, b) => b.companies - a.companies,
  );
  const visible = sorted
    .filter((row) => row.label !== 'Other')
    .slice(0, 5);
  const rest = sorted.filter((row) => !visible.includes(row));
  if (rest.length === 0) return visible;

  const other = rest.reduce<SectorRow>(
    (acc, row) => ({
      label: 'Other',
      companies: acc.companies + row.companies,
    }),
    { label: 'Other', companies: 0 },
  );
  return [...visible, other];
})();

const SECTOR_CHART = [...SECTOR_ROWS].sort(
  (a, b) =>
    Number(a.label === 'Other') - Number(b.label === 'Other') ||
    b.companies - a.companies,
);
const SECTOR_MAX = Math.max(...SECTOR_CHART.map((row) => row.companies), 1);

type RoleCategory = 'internship' | 'fullTime' | 'managementTrainee' | 'other';

// Classic regex classifier: no LLM, no external parsing. Anything the three
// patterns do not catch stays in "Other" instead of being silently bucketed.
const INTERNSHIP_PATTERN = /intern/i;
const MT_PATTERN =
  /management trainee|graduate trainee|\btrainee\b|graduate talent|academy|fellowship|apprentice|talent/i;
const FULL_TIME_PATTERN =
  /full.?time|permanent|experienced|freshgraduate|general hiring|staff|engineer|analyst|manager|scientist|specialist|officer|developer|consultant|architect|sales|supervisor|head|lead|director|coordinator|representative|associate|program|position/i;

function classifyRole(type: string): RoleCategory {
  if (INTERNSHIP_PATTERN.test(type)) return 'internship';
  if (MT_PATTERN.test(type)) return 'managementTrainee';
  if (FULL_TIME_PATTERN.test(type)) return 'fullTime';
  return 'other';
}

const ROLE_COUNTS = companies.reduce<Record<RoleCategory, number>>(
  (counts, company) => {
    for (const opening of company.openings) {
      counts[classifyRole(opening.type)] += 1;
    }
    return counts;
  },
  { internship: 0, fullTime: 0, managementTrainee: 0, other: 0 },
);

const LOCATION_ROWS = [
  { label: 'Yogyakarta', pattern: /yogyakarta/i },
  { label: 'Jakarta', pattern: /jakarta|jabodetabek/i },
  { label: 'Papua New Guinea', pattern: /papua/i },
].map(({ label, pattern }) => ({
  label,
  count: companies.reduce(
    (total, company) =>
      total +
      company.openings.filter(
        (opening) => opening.location && pattern.test(opening.location),
      ).length,
    0,
  ),
}));

const TOTAL_OPENINGS = companies.reduce(
  (total, company) => total + company.openings.length,
  0,
);
const HIRING_COMPANIES = new Set(
  booths
    .map((booth) => booth.companyId)
    .filter((id): id is string => Boolean(id)),
).size;

/** Top company/tag facts; static data, computed once at module load. */
const TOP = (() => {
  const topCompany = [...companies].sort(
    (a, b) => b.openings.length - a.openings.length,
  )[0];

  const tagCounts = new Map<string, number>();
  for (const company of companies) {
    for (const tag of company.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  const topTagCompanyCount = companies.filter((company) =>
    company.tags.some((tag) => topTags.some(([topTag]) => topTag === tag)),
  ).length;

  return { topCompany, topTags, topTagCompanyCount };
})();

/**
 * Stats view — Swift Charts direction: one panel, hairline-separated cells,
 * big values, small muted labels. Every number is derived from the event
 * data (companies, openings, sessions, bookmarks) — no invented analytics.
 */
export default function Insights({ loading = false }: { loading?: boolean }) {
  const bookmarkedIds = useMapStore((s) => s.bookmarkedIds);
  const selectedDayId = useMapStore((s) => s.selectedDayId);
  const reduceMotion = useReducedMotion() ?? false;
  const cards = ui.insights.cards;
  const copy = ui.insights.kpi;

  // Derived distributions are memoized so reconciliation does not re-walk
  // every session on each render.
  const derived = useMemo(() => {
    const sessionsToday = sessions.filter(
      (s) => s.dayId === selectedDayId,
    ).length;

    const walkInsByDay = event.days.map((day) => ({
      label: new Date(`${day.date}T00:00:00Z`).toLocaleDateString(
        event.locale,
        {
          day: 'numeric',
          month: 'short',
          timeZone: 'UTC',
        },
      ),
      value: sessions.filter(
        (s) => s.dayId === day.id && s.trackId === 'walk-in-interview',
      ).length,
    }));
    const walkIns = walkInsByDay.reduce((total, row) => total + row.value, 0);

    // Short axis labels for the narrow KPI tile; the full label stays in the
    // hover caption and accessible bar label.
    const trackMeta: Record<string, { label: string; shortLabel: string }> = {
      'walk-in-interview': {
        label: getTrack('walk-in-interview')?.label ?? 'Walk-in Interview',
        shortLabel: 'Walk-in',
      },
      stage: { label: 'Panggung', shortLabel: 'Panggung' },
    };
    const sessionsByTrack = [...new Set(sessions.map((s) => s.trackId))]
      .map((trackId) => ({
        label:
          trackMeta[trackId]?.label ??
          getTrack(trackId)?.label ??
          trackId,
        shortLabel:
          trackMeta[trackId]?.shortLabel ??
          getTrack(trackId)?.label ??
          trackId,
        value: sessions.filter((s) => s.trackId === trackId).length,
      }))
      .filter((row) => row.value > 0);

    return { sessionsToday, walkInsByDay, walkIns, sessionsByTrack };
  }, [selectedDayId]);

  if (loading) return <InsightsSkeleton />;

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
      value: derived.sessionsToday,
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
    {
      key: 'internships',
      label: copy.internships,
      value: ROLE_COUNTS.internship,
      format: whole,
      caption: copy.ofAllOpenings,
    },
    {
      key: 'fullTime',
      label: copy.fullTime,
      value: ROLE_COUNTS.fullTime,
      format: whole,
      caption: copy.ofAllOpenings,
    },
    {
      key: 'managementTrainee',
      label: copy.managementTrainee,
      value: ROLE_COUNTS.managementTrainee,
      format: whole,
      caption: copy.ofAllOpenings,
    },
    {
      key: 'otherRoles',
      label: copy.other,
      value: ROLE_COUNTS.other,
      format: whole,
      caption: copy.ofAllOpenings,
    },
  ];

  const kpis: KpiData[] = [
    {
      label: copy.walkIns,
      value: derived.walkIns,
      format: whole,
      trend: derived.walkInsByDay.map((row) => row.value),
      trendLabels: derived.walkInsByDay.map((row) => row.label),
      trendShortLabels: derived.walkInsByDay.map((row) => row.label),
      seriesLabel: copy.byDay,
    },
    {
      label: copy.sessions,
      value: sessions.length,
      format: whole,
      trend: derived.sessionsByTrack.map((row) => row.value),
      trendLabels: derived.sessionsByTrack.map((row) => row.label),
      trendShortLabels: derived.sessionsByTrack.map((row) => row.shortLabel),
      seriesLabel: copy.byTrack,
    },
  ];

  return (
    <div className="@container reveal-product">
      <div className="section-label mb-2.5 border-b border-[#232326] pb-2">
        {ui.insights.title}
      </div>

      {/* Bento: visitor facts, real distributions and top facts share one
          hairline panel — no nested cards, no section label between them. */}
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
        {TOP.topCompany && (
          <TopTile
            className="col-span-2"
            label={copy.topCompany}
            value={TOP.topCompany.name}
            caption={`${TOP.topCompany.openings.length} open roles`}
          />
        )}
        {TOP.topTags.length > 0 && (
          <TopTile
            label={copy.topTags}
            tags={TOP.topTags.map(([tag]) => tag)}
            caption={`${TOP.topTagCompanyCount} companies`}
          />
        )}
        <TopTile
          label={copy.topLocation}
          rows={LOCATION_ROWS.map((row) => ({
            label: row.label,
            value: row.count,
          }))}
          caption="from stated opening locations"
        />
      </div>
      {TOTAL_OPENINGS === 0 && (
        <p className="mt-2 text-[10.5px] text-[#8f8f8f]">
          {careerFairMeta.status === 'unavailable'
            ? ui.boothDetail.openingsUnavailableTitle
            : ui.boothDetail.openingsEmptyTitle}
        </p>
      )}

      {/* Companies per sector — rounded Swift-Charts-style horizontal bars. */}
      <div className="section-label mt-5 mb-2.5">{ui.insights.sectorsLabel}</div>
      <div className="panel-list p-2">
        <div className="space-y-2">
          {SECTOR_CHART.map((row, index) => (
            <div
              key={`${row.label}-${index}`}
              className="flex items-center gap-2.5 px-1"
            >
              <span
                className="w-[6.75rem] shrink-0 truncate text-[11px] text-ink-body"
                title={row.label}
              >
                {row.label}
              </span>
              <span
                className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[#1f1f23]"
                title={`${row.label}: ${row.companies} companies`}
              >
                {[25, 50, 75].map((mark) => (
                  <span
                    key={mark}
                    aria-hidden="true"
                    className="absolute inset-y-0 border-l border-white/[0.05]"
                    style={{ left: `${mark}%` }}
                  />
                ))}
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full"
                  initial={reduceMotion ? false : { width: 0, opacity: 0 }}
                  animate={{
                    width: `${Math.max(4, Math.round((row.companies / SECTOR_MAX) * 100))}%`,
                    opacity: 1,
                  }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          duration: 0.18,
                          bounce: 0,
                          delay: index * 0.06,
                        }
                  }
                  style={{
                    backgroundColor:
                      SECTOR_COLORS[index % SECTOR_COLORS.length],
                  }}
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
