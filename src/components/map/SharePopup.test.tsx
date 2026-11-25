import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SharePopup from './SharePopup';

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

describe('SharePopup', () => {
  it('shows the link, copies it, and reports analytics success', async () => {
    const onCopy = vi.fn();
    render(
      <SharePopup
        title="Share"
        url="https://example.com/map?booth=c1"
        copyLabel="Copy link"
        copiedLabel="Link copied"
        channels={[]}
        onCopy={onCopy}
      />,
    );

    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toHaveValue(
      'https://example.com/map?booth=c1',
    );

    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /link copied/i }),
      ).toBeInTheDocument(),
    );
    expect(writeText).toHaveBeenCalledWith('https://example.com/map?booth=c1');
    expect(onCopy).toHaveBeenCalledWith(true);
  });

  it('renders bordered channel links with the supplied hrefs', () => {
    render(
      <SharePopup
        title="Share"
        url="https://example.com/map?booth=c1"
        copyLabel="Copy link"
        copiedLabel="Link copied"
        channels={[
          { id: 'x', label: 'X', href: 'https://x.com/intent' },
          { id: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/' },
        ]}
        onCopy={() => {}}
      />,
    );

    expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute(
      'href',
      'https://x.com/intent',
    );
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/',
    );
  });
});
