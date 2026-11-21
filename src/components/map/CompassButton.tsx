interface CompassButtonProps {
  onClick: () => void;
  label?: string;
}

export default function CompassButton({ onClick, label = 'Reset bearing to north' }: CompassButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 shadow-lg transition-[transform,colors] hover:bg-zinc-800 hover:text-white active:scale-95"
      aria-label={label}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-300 group-hover:rotate-12"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
        <path d="m16.24 7.76-4.24 4.24-4.24-4.24M7.76 16.24l4.24-4.24 4.24 4.24" />
        <path d="M12 8l-2 8h4l-2-8z" fill="currentColor" />
      </svg>
    </button>
  );
}
