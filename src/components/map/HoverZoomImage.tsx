import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils/cn';

/**
 * Cursor-tracked image zoom in the spirit of the 21st.dev Hover Zoom: the
 * transform origin follows the pointer so the poster magnifies where you
 * look, then settles back on leave. Touch devices stay at 1×.
 */
export default function HoverZoomImage({
  src,
  alt,
  className,
  scale = 1.2,
}: {
  src: string;
  alt: string;
  className?: string;
  scale?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [origin, setOrigin] = useState('50% 50%');
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden', className)}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHovering(true);
      }}
      onPointerLeave={() => setHovering(false)}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
        const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
        setOrigin(`${x}% ${y}%`);
      }}
    >
      <motion.img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full select-none object-contain"
        style={{ transformOrigin: origin }}
        animate={{ scale: hovering && !reduceMotion ? scale : 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      />
    </div>
  );
}
