import { useState, useCallback, useRef } from 'react';
import { shareBooth } from '../../lib/map/share';
import { track } from '../../lib/analytics';
import { getBooth, getCompanyForBooth } from '../../lib/data';

export function useShareBooth() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const share = useCallback(async (boothId: string) => {
    const ok = await shareBooth(boothId);
    const booth = getBooth(boothId);
    const company = getCompanyForBooth(boothId);

    track('share.send', {
      boothId,
      companyId: booth?.companyId,
      companyName: company?.name,
      success: ok,
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setFeedback(ok ? 'Copied!' : 'Unable to share');
    timeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 2000);
  }, []);

  return { share, feedback };
}
