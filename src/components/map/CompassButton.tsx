import type { RefObject } from 'react';

interface CompassButtonProps {
  onClick: () => void;
  label?: string;
  /** Ref to the needle group; MapLibreMap rotates it from map.getBearing()
   *  on every `rotate` event without re-rendering the island. */
  needleRef?: RefObject<SVGGElement | null>;
}

/**
 * Compass: a simple two-tone triangle — pink north, white south — rotated
 * imperatively from map.getBearing().
 */
export default function CompassButton({
  onClick,
  label = 'Reset bearing to north',
  needleRef,
}: CompassButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-10 w-10 items-center justify-center rounded-full border border-[#34343a] bg-[#141416] text-white transition-[transform,colors] hover:border-[#4a4a52] active:scale-95"
      aria-label={label}
      title={label}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g ref={needleRef} transform="rotate(0 12 12)">
          <path d="M12 2.5 18 13H6Z" fill="var(--accent-pink)" />
          <path d="M12 21.5 6 13h12Z" fill="#f6f6f6" />
        </g>
      </svg>
    </button>
  );
}
