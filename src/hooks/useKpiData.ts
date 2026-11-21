import { useEffect, useState } from 'react';
import type { KpiData } from '../components/kpi/KpiTile';

export interface KpiResponse {
  items: KpiData[];
  updatedAt: string;
}

export type KpiDataProvider = () => Promise<KpiResponse>;

/**
 * Default static provider. Replace with a fetch-backed provider once the
 * analytics data lake endpoint is available.
 */
export const defaultKpiProvider: KpiDataProvider = async () => {
  return {
    items: [],
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
