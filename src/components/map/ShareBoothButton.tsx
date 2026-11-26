import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Popover } from '@base-ui/react/popover';
import { Share2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { getBoothShareUrl, getShareIntent } from '../../lib/map/share';
import { track } from '../../lib/analytics';
import { getBooth, getCompanyForBooth, ui } from '../../lib/data';
import SharePopup from './SharePopup';

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
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  const url = getBoothShareUrl(boothId);
  const booth = getBooth(boothId);
  const company = getCompanyForBooth(boothId);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!open || !isMobile) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isMobile]);

  const details = {
    boothId,
    companyId: booth?.companyId,
    companyName: company?.name,
  };

  const onSend = (channel: 'x' | 'whatsapp') => {
    track('share.send', { ...details, channel, success: true });
    setOpen(false);
  };

  const triggerClass = cn(
    'flex size-11 items-center justify-center text-white/60 transition-[transform,colors] hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-pink)] active:scale-95 md:size-8',
    className,
  );

  const sharePopup = (
    <SharePopup
      title={ui.boothDetail.shareTitle}
      url={url}
      copyLabel={ui.boothDetail.copyLink}
      copiedLabel={ui.boothDetail.linkCopied}
      channels={[
        {
          id: 'x',
          label: 'X',
          href: getShareIntent('x', url),
          onClick: () => onSend('x'),
        },
        {
          id: 'whatsapp',
          label: 'WhatsApp',
          href: getShareIntent('whatsapp', url),
          onClick: () => onSend('whatsapp'),
        },
      ]}
      onCopy={(success) =>
        track('share.send', { ...details, channel: 'copy', success })
      }
      onClose={() => setOpen(false)}
    />
  );

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={ui.boothDetail.shareLabel}
          title={ui.boothDetail.shareLabel}
          className={triggerClass}
        >
          <Share2 size={iconSize} className="md:h-[18px] md:w-[18px]" />
        </button>
        {open &&
          createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4"
              role="presentation"
              onClick={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={ui.boothDetail.shareTitle}
                className="relative w-full max-w-[26rem]"
                onClick={(event) => event.stopPropagation()}
              >
                {sharePopup}
              </div>
            </div>,
            document.body,
          )}
      </>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={ui.boothDetail.shareLabel}
        title={ui.boothDetail.shareLabel}
        className={triggerClass}
      >
        <Share2 size={iconSize} className="md:h-[18px] md:w-[18px]" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={6}
          className="z-[120]"
        >
          <Popover.Popup
            aria-label={ui.boothDetail.shareTitle}
            className={cn(
              'w-80 max-w-[calc(100vw-2rem)] origin-[var(--transform-origin)] outline-none',
              'transition-[transform,opacity] duration-150',
              'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            )}
          >
            {sharePopup}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
