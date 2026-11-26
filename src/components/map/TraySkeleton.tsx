/**
 * Short loading mirror for a venue/facility detail card. The tray raises at
 * the same time, so this prevents the card from snapping in before the sheet
 * settles. The glow is the same pink/cyan family as the map accents; the
 * shimmer respects `prefers-reduced-motion` globally.
 */
export default function TraySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading detail">
      <div className="relative overflow-hidden border border-line bg-[#141416]">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(120% 90% at 15% 0%, rgba(255,45,111,0.16), transparent 55%), radial-gradient(100% 70% at 100% 100%, rgba(69,215,201,0.10), transparent 60%)',
          }}
        />

        <div className="relative h-16 border-b border-line p-3">
          <div className="skeleton-shimmer h-full w-full rounded-[1px]" />
        </div>

        <div className="relative space-y-2 px-3 pt-3 pb-2">
          <div className="skeleton-shimmer h-3 w-24 rounded-[1px]" />
          <div className="skeleton-shimmer h-5 w-3/4 rounded-[1px]" />
          <div className="flex gap-1.5 pt-1">
            <div className="skeleton-shimmer h-4 w-16 rounded-[1px]" />
            <div className="skeleton-shimmer h-4 w-20 rounded-[1px]" />
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="skeleton-shimmer h-3 w-full rounded-[1px]" />
            <div className="skeleton-shimmer h-3 w-5/6 rounded-[1px]" />
            <div className="skeleton-shimmer h-3 w-2/3 rounded-[1px]" />
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-1.5 border-t border-line p-3">
          <div className="skeleton-shimmer h-10 rounded-[1px]" />
          <div className="skeleton-shimmer h-10 rounded-[1px]" />
        </div>
      </div>
    </div>
  );
}
