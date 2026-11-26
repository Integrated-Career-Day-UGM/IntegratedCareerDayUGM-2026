/**
 * Tooltip needle (Base Web FixedMarker-inspired): a thin stem plus a square
 * endpoint. Props keep the tooltips aligned with the pin language while the
 * selection tooltips can run darker/longer than the map pins.
 */
export default function TooltipNeedle({
  color = '#000000',
  height = 22,
}: {
  color?: string;
  height?: number;
}) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-full flex -translate-x-1/2 flex-col items-center">
      <span style={{ height, backgroundColor: color }} className="w-[2px]" />
      <span style={{ backgroundColor: color }} className="size-[4px]" />
    </div>
  );
}
