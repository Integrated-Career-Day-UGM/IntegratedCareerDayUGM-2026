import type { ReactNode } from 'react';

/**
 * Figma-style selection frame: pink border + four corner handles
 * (node 1742-24528 family). Purely decorative wrapper.
 */
export default function SelectionFrame({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const handle = 'pointer-events-none absolute z-0 size-[7px] bg-[#ff316b]';
  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute -inset-[3px] z-0 border-2 border-[#ff316b]" />
      <div className={`${handle} -left-[5px] -top-[5px]`} />
      <div className={`${handle} -right-[5px] -top-[5px]`} />
      <div className={`${handle} -bottom-[5px] -left-[5px]`} />
      <div className={`${handle} -bottom-[5px] -right-[5px]`} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
