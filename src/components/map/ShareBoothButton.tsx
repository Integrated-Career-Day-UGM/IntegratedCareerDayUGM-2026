import { useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { Check, Copy, Share2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { getBoothShareUrl, getShareIntent } from '../../lib/map/share';
import { track } from '../../lib/analytics';
import { getBooth, getCompanyForBooth, ui } from '../../lib/data';

const X_PATH =
  'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z';
const WHATSAPP_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';

/**
 * Share a booth card, not the company's own website: the deep link opens
 * `/map?booth=<id>`, so the recipient lands on the exact card (and its map
 * context) on our site. Only X, WhatsApp and copy-link are offered.
 */
export default function ShareBoothButton({
  boothId,
  className,
  iconSize = 18,
}: {
  boothId: string;
  className?: string;
  iconSize?: number;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const url = getBoothShareUrl(boothId);
  const booth = getBooth(boothId);
  const company = getCompanyForBooth(boothId);

  const details = {
    boothId,
    companyId: booth?.companyId,
    companyName: company?.name,
  };

  const onSend = (channel: 'x' | 'whatsapp') => {
    track('share.send', { ...details, channel, success: true });
    setOpen(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track('share.send', { ...details, channel: 'copy', success: true });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      track('share.send', { ...details, channel: 'copy', success: false });
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={ui.boothDetail.shareLabel}
        title={ui.boothDetail.shareLabel}
        className={cn(
          'flex size-8 items-center justify-center text-white/60 transition-[transform,colors] hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-pink)] active:scale-95',
          className,
        )}
      >
        <Share2 size={iconSize} />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={6}
          className="z-[120]"
        >
          <Popover.Popup
            className={cn(
              'w-[15.5rem] origin-[var(--transform-origin)] rounded-2xl border border-[#e4e4e7] bg-[#f7f7f8] p-4 text-[#18181b] shadow-[0_18px_50px_rgba(0,0,0,0.45)] outline-none',
              'transition-[transform,opacity] duration-150',
              'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
              'md:w-[17rem] md:p-5',
            )}
          >
            <p className="text-center text-[13px] font-semibold tracking-[-0.1px]">
              {ui.boothDetail.shareTitle}
            </p>

            {/* The link itself is the message: no referral copy, no headline. */}
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#e4e4e7] bg-white py-2 pl-3 pr-1.5">
              <span className="min-w-0 flex-1 truncate text-[10px] leading-5 text-[#52525b] md:text-[11px]">
                {copied
                  ? ui.boothDetail.linkCopied
                  : url.replace(/^https?:\/\//, '')}
              </span>
              <button
                type="button"
                onClick={copy}
                aria-label={ui.boothDetail.copyLink}
                title={ui.boothDetail.copyLink}
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#71717a] transition-colors hover:bg-[#f4f4f5] hover:text-[#18181b]"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <a
                href={getShareIntent('x', url)}
                target="_blank"
                rel="noreferrer"
                onClick={() => onSend('x')}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0c0c0f] text-[11px] font-semibold text-white transition-transform active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="currentColor">
                  <path d={X_PATH} />
                </svg>
                X
              </a>
              <a
                href={getShareIntent('whatsapp', url)}
                target="_blank"
                rel="noreferrer"
                onClick={() => onSend('whatsapp')}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#25d366] text-[11px] font-semibold text-white transition-transform active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="currentColor">
                  <path d={WHATSAPP_PATH} />
                </svg>
                WhatsApp
              </a>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
