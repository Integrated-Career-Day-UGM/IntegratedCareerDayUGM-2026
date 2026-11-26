import { cn } from '../../lib/utils/cn';

export type EmptyStateProps = {
  art?: 'empty' | 'sad';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'panel' | 'inline';
  className?: string;
};

/**
 * Shared empty state. The art comes from the Figma not-found frames and is
 * decorative; the title/description carry the meaning. No looping motion, no
 * layout-changing animation.
 */
export default function EmptyState({
  art = 'empty',
  title,
  description,
  action,
  variant = 'panel',
  className,
}: EmptyStateProps) {
  const inline = variant === 'inline';
  const src = art === 'sad' ? '/empty/sparky-sad.svg' : '/empty/sparky-empty.svg';

  return (
    <div
      className={cn(
        'empty-state-enter',
        inline
          ? 'flex items-center gap-3 border border-line bg-[#141416] p-3 text-left'
          : 'flex flex-col items-center px-4 py-8 text-center',
        className,
      )}
      role={inline ? undefined : 'status'}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className={cn(
          'shrink-0 select-none object-contain',
          inline ? 'h-14 w-14' : 'h-24 w-24 md:h-28 md:w-28',
        )}
      />
      <div className={cn('min-w-0', inline ? '' : 'mt-3')}>
        <div
          className={cn(
            'font-heading font-bold text-white',
            inline ? 'text-[13px] leading-tight' : 'text-[17px] leading-tight',
          )}
        >
          {title}
        </div>
        {description && (
          <p
            className={cn(
              'text-[#8f8f8f]',
              inline
                ? 'mt-0.5 text-[10.5px] leading-snug'
                : 'mt-1.5 max-w-[26ch] text-[11px] leading-snug',
            )}
          >
            {description}
          </p>
        )}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              'bg-white font-heading font-bold text-black transition-colors hover:bg-white/90 active:scale-[0.98]',
              inline ? 'mt-2 px-2 py-1 text-[10.5px]' : 'mt-4 px-3 py-1.5 text-[11px]',
            )}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
