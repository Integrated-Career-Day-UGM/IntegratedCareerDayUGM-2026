import { TrendingUp, Users, Calendar, Bookmark, Briefcase } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { useKpiData } from '../hooks/useKpiData';
import KpiTile from '../components/kpi/KpiTile';
import type { KpiData } from '../components/kpi/KpiTile';
import { ui, booths, sessions, event } from '../lib/data';

const emptyKpis: KpiData[] = [
  {
    label: 'Active Openings',
    value: null,
    deltaLabel: 'tracked across registered companies',
    trend: [],
  },
  {
    label: 'Most Bookmarked Sector',
    value: null,
    deltaLabel: 'based on visitor saves',
    trend: [],
  },
  {
    label: 'Avg. Response Rate',
    value: null,
    deltaLabel: 'company reply rate after the event',
    trend: [],
  },
];

export default function Insights() {
  const bookmarkedIds = useMapStore((s) => s.bookmarkedIds);
  const { data: kpiData, loading: kpiLoading } = useKpiData();
  const cards = ui.insights.cards;

  const stats = [
    {
      key: 'attendance',
      icon: Users,
      label: cards.attendance.label,
      value: cards.attendance.value,
      change: cards.attendance.change,
      caption: cards.attendance.caption,
    },
    {
      key: 'companies',
      icon: TrendingUp,
      label: cards.companies.label,
      value: String(booths.filter((b) => b.companyId).length),
      caption: cards.companies.caption,
    },
    {
      key: 'sessions',
      icon: Calendar,
      label: cards.sessions.label,
      value: String(sessions.filter((s) => s.dayId === event.days[0].id).length),
      caption: cards.sessions.caption,
    },
    {
      key: 'bookmarks',
      icon: Bookmark,
      label: cards.bookmarks.label,
      value: cards.bookmarks.value.replace('{count}', String(bookmarkedIds.length)),
      caption: cards.bookmarks.caption,
    },
  ];

  const kpis = kpiData?.items && kpiData.items.length > 0 ? kpiData.items : emptyKpis;

  return (
    <div className="@container space-y-5">
      <div>
        <div className="font-heading text-xs font-medium text-ink-muted">{ui.insights.title}</div>
        <div className="text-[10px] text-[#a1a1aa]">{ui.insights.subtitle}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className="bg-card p-3 transition-colors hover:bg-card-hover"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-heading text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                  {stat.label}
                </span>
                <Icon size={14} className="text-ink-muted" />
              </div>
              <div className="font-heading text-2xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-[10px] text-ink-muted">
                {stat.change && <span className="mr-1 text-[var(--accent-pink)]">{stat.change}</span>}
                {stat.caption}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-ink-muted" />
          <div>
            <div className="font-heading text-xs font-medium text-ink-muted">{ui.insights.kpiSectionTitle}</div>
            <div className="text-[10px] text-[#a1a1aa]">{ui.insights.kpiSectionSubtitle}</div>
          </div>
        </div>
        {/* Container query, not viewport: the 2-col KPI grid must fire in a
            390px mobile sheet AND the ~330px sidebar — wherever the region
            is at least ~20rem wide (§1; the old sm: fired exactly backwards). */}
        <div className="grid grid-cols-1 gap-2 @[20rem]:grid-cols-2">
          {kpis.map((kpi, index) => (
            <KpiTile
              key={`${kpi.label}-${index}`}
              {...kpi}
              loading={kpiLoading}
              className="h-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
