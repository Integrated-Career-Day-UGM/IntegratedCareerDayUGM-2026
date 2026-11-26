import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Elevated } from '../../lib/elevated';
import { useShape } from '../../lib/shape-context';
import { cn } from '../../lib/utils/cn';
import type { IconComponentProps } from '../../lib/icon-context';

const X_PATH =
  'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z';
const WHATSAPP_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';

export type SharePopupChannel = {
  id: 'x' | 'whatsapp';
  label: string;
  href: string;
  onClick?: () => void;
};

export type SharePopupProps = {
  title: string;
  url: string;
  copyLabel: string;
  copiedLabel: string;
  copyHint?: string;
  channels: SharePopupChannel[];
  /** Called after the clipboard attempt; `false` means the copy failed. */
  onCopy: (success: boolean) => void;
  className?: string;
};

/**
 * The project's FF components expect the shadcn aliases (--foreground,
 * --background, --tint, ...). The map shell only ships the Tailwind v4
 * --color-* tokens, so the popup provides the aliases locally instead of
 * inheriting the light landing-page values.
 */
const fluidSurface = {
  '--foreground': '#fafafa',
  '--background': '#09090b',
  '--border': '#2a2a2a',
  '--tint': '#26262b',
  '--tint-hover': '#303036',
  '--hover': '#262626',
  '--active': '#333333',
  '--focus-ring': '#ff2d6f',
} as CSSProperties;

function XBrandIcon({ size = 16, className }: IconComponentProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('shrink-0 text-white', className)}
      fill="currentColor"
    >
      <path d={X_PATH} />
    </svg>
  );
}

function WhatsAppBrandIcon({ size = 16, className }: IconComponentProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('shrink-0 text-[#25d366]', className)}
      fill="currentColor"
    >
      <path d={WHATSAPP_PATH} />
    </svg>
  );
}

/**
 * Reusable share-popup body: dark card surface, sharp corners, a white copy
 * slab, and bordered X / WhatsApp chips. The trigger + popover owner passes
 * the URL and analytics callbacks; a walk-in room share can reuse this
 * without rebuilding the surface.
 */
export default function SharePopup({
  title,
  url,
  copyLabel,
  copiedLabel,
  copyHint = 'Or copy link',
  channels,
  onCopy,
  className,
}: SharePopupProps) {
  const shape = useShape();
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = async () => {
    let success = true;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      success = false;
    }
    onCopy(success);
    if (!success) return;

    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Elevated
      offset={2}
      data-share-popup=""
      style={fluidSurface}
      className={cn(
        shape.container,
        'w-full border border-line bg-[#141416] p-4 text-white',
        className,
      )}
    >
      <div className="text-balance font-heading text-[1.25rem] font-bold leading-tight text-white md:text-[18px] md:leading-none">
        {title}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {channels.map((channel) => (
          <Button
            key={channel.id}
            variant="tertiary"
            size="default"
            className="w-full"
            leadingIcon={
              channel.id === 'x' ? XBrandIcon : WhatsAppBrandIcon
            }
            render={
              <a
                href={channel.href}
                target="_blank"
                rel="noreferrer"
                onClick={channel.onClick}
              />
            }
          >
            {channel.label}
          </Button>
        ))}
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <div className="mb-2 text-[0.8125rem] text-[#8f8f8f] md:text-[11px]">{copyHint}</div>
        <div className="flex items-center gap-2">
          <Input
            aria-label="Link"
            readOnly
            type="url"
            size="default"
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            className="min-w-0 flex-1 text-[1rem] md:text-[12px]"
          />
          <Button
            type="button"
            size="icon"
            aria-label={copied ? copiedLabel : copyLabel}
            title={copied ? copiedLabel : copyLabel}
            aria-live="polite"
            onClick={copy}
          >
            {copied ? <Check size={16} strokeWidth={2.4} /> : <Copy size={16} strokeWidth={2} />}
          </Button>
        </div>
      </div>
    </Elevated>
  );
}
