import { motion } from 'motion/react';
import { Star } from 'lucide-react';

/**
 * Job Matcher entry point. Decoupled from the map: it only broadcasts the
 * open event. Magic offset-path border + a yellow ball around the white star,
 * with a desktop hover shimmer.
 */
export default function MatchingTrigger() {
  const open = () => {
    window.dispatchEvent(new CustomEvent('icd:open-matching'));
  };

  return (
    <button
      type="button"
      onClick={open}
      className="group relative inline-flex h-full min-h-9 items-center gap-2 rounded-full border border-[#34343a] bg-[#1c1c20] py-1 pl-1 pr-3 font-heading text-[0.75rem] font-bold text-white transition-colors hover:border-[#4a4a52] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-pink)] lg:min-h-10 lg:pr-4"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] border-2 border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
      >
        <motion.span
          className="absolute aspect-square bg-linear-to-r from-transparent via-[#f5c518] to-[#f5c518]"
          animate={{ offsetDistance: ['0%', '100%'] }}
          style={{ width: 20, offsetPath: 'rect(0 auto auto 0 round 20px)' }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 5, ease: 'linear' }}
        />
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
      >
        <span className="matching-shimmer absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/20 to-transparent" />
      </span>
      <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f5c518]">
        <Star size={14} strokeWidth={0} fill="currentColor" className="text-white" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/70 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-full"
        />
      </span>
      <span className="inline">Job Matcher</span>
    </button>
  );
}
