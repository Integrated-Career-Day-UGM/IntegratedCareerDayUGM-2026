import { useEffect, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';

interface FullscreenButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
  enterLabel?: string;
  exitLabel?: string;
}

export default function FullscreenButton({
  targetRef,
  enterLabel = 'Enter fullscreen',
  exitLabel = 'Exit fullscreen',
}: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = async () => {
    const target = targetRef.current;
    if (!target) return;

    try {
      if (!document.fullscreenElement) {
        await target.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen may be blocked or unavailable; ignore silently.
    }
  };

  const Icon = isFullscreen ? Minimize : Maximize;

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 shadow-lg transition-[transform,colors] hover:bg-zinc-800 hover:text-white active:scale-95"
      aria-label={isFullscreen ? exitLabel : enterLabel}
    >
      <Icon size={18} strokeWidth={2} />
    </button>
  );
}
