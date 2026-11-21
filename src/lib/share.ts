import { getBooth, getCompanyForBooth } from './data';

export function getBoothShareUrl(boothId: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('booth', boothId);
  return url.toString();
}

export async function shareBooth(boothId: string): Promise<boolean> {
  const booth = getBooth(boothId);
  const company = getCompanyForBooth(boothId);
  if (!booth) return false;

  const url = getBoothShareUrl(boothId);
  const title = `${company?.name ?? booth.label} — Booth ${booth.code}`;

  const openingsText =
    company?.openings && company.openings.length > 0
      ? `\nOpenings: ${company.openings.map((o) => `${o.title} (${o.type})`).join(', ')}`
      : '';

  const text = `Check out ${company?.name ?? booth.label} at Booth ${booth.code} at UGM Integrated Career Days 2026.${openingsText}`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        // Fall through to clipboard
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
