import { useEffect, useState } from 'react';

/**
 * Local posters live under `public/`; a wrong/missing path should simply not
 * render its button. Preflight the image once per URL instead of showing a
 * broken poster CTA or an empty modal.
 */
export default function usePosterAvailable(url?: string | null) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!url) {
      setAvailable(false);
      return;
    }
    setAvailable(false);
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) setAvailable(true);
    };
    image.onerror = () => {
      if (!cancelled) setAvailable(false);
    };
    image.src = url;
    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [url]);

  return available;
}
