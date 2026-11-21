import type { ReactNode } from 'react';

/**
 * Figma-style selection frame: pink border + four corner handles
 * (node 1742-24528 family). Purely decorative wrapper.
 *
 * `frameClassName` overrides the border box inset — use it when the frame
 * must extend asymmetrically around its content (e.g. the header lockup,
 * whose frame reaches further right/bottom per the Figma design). Handles
 * are anchored to the frame box itself, so they follow its corners.
 */
export default function SelectionFrame({
  children,
  className = '',
  frameClassName = '-inset-[3px]',
}: {
  children: ReactNode;
  className?: string;
  frameClassName?: string;
}) {
  const handle = 'pointer-events-none absolute size-[7px] bg-[#ff316b]';
  return (
    <div className={`relative ${className}`}>
      <div
        className={`pointer-events-none absolute z-0 border-2 border-[#ff316b] ${frameClassName}`}
      >
        <div className={`${handle} -left-[3px] -top-[3px]`} />
        <div className={`${handle} -right-[3px] -top-[3px]`} />
        <div className={`${handle} -bottom-[3px] -left-[3px]`} />
        <div className={`${handle} -bottom-[3px] -right-[3px]`} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
