import { ui } from '../../../lib/data';

const cellClass = 'flex min-w-0 flex-col gap-2 bg-[#141416] p-3';
const skeleton = 'skeleton-shimmer rounded-[1px]';

/**
 * Loading mirror of the final Insights geometry: same section rails, same
 * 2-column hairline bento, eight stat cells, two KPI cells, one full-width
 * top-company cell, two top-fact cells, and six sector rows.
 */
export default function InsightsSkeleton() {
  return (
    <div
      className="@container reveal-product"
      data-insights-skeleton=""
      aria-busy="true"
      aria-label={`Loading ${ui.insights.title}`}
    >
      <div className="section-label mb-2.5 border-b border-[#232326] pb-2">
        <div className={cnSkeleton('h-[16.5px] w-20')} />
      </div>

      <div className="grid grid-cols-2 gap-px border border-line bg-[#2a2a2a]">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={`stat-${index}`}
            data-skeleton-variant="stat"
            className={cellClass}
          >
            <div className={cnSkeleton('h-[16.5px] w-20')} />
            <div className={cnSkeleton('h-6 w-16')} />
            <div className={cnSkeleton('h-4 w-24')} />
          </div>
        ))}
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={`kpi-${index}`}
            data-skeleton-variant="kpi"
            className={cellClass}
          >
            <div className={cnSkeleton('h-[16.5px] w-24')} />
            <div className={cnSkeleton('h-6 w-16')} />
            <div className={cnSkeleton('h-4 w-24')} />
            <div className={cnSkeleton('h-11 w-full')} />
          </div>
        ))}
        <div
          data-skeleton-variant="stat"
          data-skeleton-top-company=""
          className={`${cellClass} col-span-2`}
        >
          <div className={cnSkeleton('h-[16.5px] w-24')} />
          <div className={cnSkeleton('h-6 w-40 max-w-full')} />
          <div className={cnSkeleton('h-4 w-24')} />
        </div>
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={`stat-tail-${index}`}
            data-skeleton-variant="stat"
            className={cellClass}
          >
            <div className={cnSkeleton('h-[16.5px] w-20')} />
            <div className={cnSkeleton('h-6 w-16')} />
            <div className={cnSkeleton('h-4 w-24')} />
          </div>
        ))}
      </div>

      <div className="section-label mt-5 mb-2.5">
        <div className={cnSkeleton('h-[16.5px] w-32')} />
      </div>
      <div className="panel-list p-2">
        <div className="space-y-1.5">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={`sector-${index}`}
              data-skeleton-sector=""
              className="flex items-center gap-3 px-1 py-1"
            >
              <div className={cnSkeleton('h-[16.5px] w-20 shrink-0')} />
              <div className={cnSkeleton('h-2 flex-1')} />
              <div className={cnSkeleton('h-[16.5px] w-6 shrink-0')} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function cnSkeleton(classes: string) {
  return `${skeleton} ${classes}`;
}
