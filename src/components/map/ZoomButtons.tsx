import { Plus, Minus } from 'lucide-react';

interface ZoomButtonsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomInLabel?: string;
  zoomOutLabel?: string;
}

export default function ZoomButtons({
  onZoomIn,
  onZoomOut,
  zoomInLabel = 'Zoom in',
  zoomOutLabel = 'Zoom out',
}: ZoomButtonsProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-lg">
      <button
        type="button"
        onClick={onZoomIn}
        className="flex h-11 w-11 items-center justify-center text-zinc-300 transition-[transform,colors] hover:bg-zinc-800 hover:text-white active:scale-95 md:h-10 md:w-10"
        aria-label={zoomInLabel}
      >
        <Plus size={20} strokeWidth={2} />
      </button>
      <span className="h-px w-full bg-zinc-800" />
      <button
        type="button"
        onClick={onZoomOut}
        className="flex h-11 w-11 items-center justify-center text-zinc-300 transition-[transform,colors] hover:bg-zinc-800 hover:text-white active:scale-95 md:h-10 md:w-10"
        aria-label={zoomOutLabel}
      >
        <Minus size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
