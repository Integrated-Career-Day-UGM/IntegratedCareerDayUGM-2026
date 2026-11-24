/**
 * Share URLs point at the booth card on our own map page, not the company's
 * external site: `/map?booth=<id>` restores the exact card, its map context
 * and the generated card artwork for whoever opens the link.
 */
export function getBoothShareUrl(boothId: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL('/map', window.location.origin);
  url.searchParams.set('booth', boothId);
  return url.toString();
}

/** Link-only share targets: no pre-filled copy, no referral text. */
export function getShareIntent(network: 'x' | 'whatsapp', url: string): string {
  const encoded = encodeURIComponent(url);
  return network === 'x'
    ? `https://x.com/intent/post?url=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}
