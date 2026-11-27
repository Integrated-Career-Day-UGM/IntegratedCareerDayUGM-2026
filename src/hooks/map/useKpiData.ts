import { useEffect, useState } from 'react';
import type { KpiData } from '../../components/map/kpi/KpiTile';
import { DEV_TOOLS } from '../../lib/dev-tools';

export interface KpiResponse {
  items: KpiData[];
  updatedAt: string;
}

export type KpiDataProvider = () => Promise<KpiResponse>;

/**
 * Dev-only fixtures so the stats surface is inspectable before the analytics
 * endpoint exists. Prod keeps shipping an empty list.
 */
const DEV_ITEMS: KpiData[] = [
  {
    label: 'Active Openings',
    value: 128,
    delta: 12.4,
    trend: [18, 26, 31, 42, 39, 57, 68, 74, 96, 128],
    trendLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'],
  },
  {
    label: 'Most Bookmarked Sector',
    value: 34,
    delta: 4.2,
    trend: [12, 14, 13, 18, 22, 20, 26, 29, 31, 34],
    trendLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'],
  },
  {
    label: 'Avg. Response Rate',
    value: 68,
    delta: -2.1,
    format: (v) => `${Math.round(v)}%`,
    trend: [82, 79, 80, 74, 76, 71, 73, 70, 69, 68],
    trendLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'],
  },
  {
    label: 'Internships',
    value: 46,
    delta: 6.8,
    format: (v) => `${Math.round(v)}%`,
    trend: [30, 32, 31, 35, 34, 38, 40, 41, 44, 46],
    trendLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'],
  },
];

/**
 * Default static provider. Replace with a fetch-backed provider once the
 * analytics data lake endpoint is available.
 */
export const defaultKpiProvider: KpiDataProvider = async () => {
  return {
    items: DEV_TOOLS ? DEV_ITEMS : [],
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Example fetch provider for a future `/api/kpi` endpoint.
 *
 * const fetchKpiProvider: KpiDataProvider = async () => {
 *   const res = await fetch('/api/kpi');
 *   if (!res.ok) throw new Error(`KPI fetch failed: ${res.status}`);
 *   return res.json();
 * };
 *
 * <Insights /> or useKpiData({ provider: fetchKpiProvider })
 */

export interface UseKpiDataOptions {
  provider?: KpiDataProvider;
}

export function useKpiData({ provider = defaultKpiProvider }: UseKpiDataOptions = {}) {
  const [data, setData] = useState<KpiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    provider()
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [provider]);

  return { data, loading, error };
}
