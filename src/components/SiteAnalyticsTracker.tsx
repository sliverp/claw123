'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function SiteAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    const dedupeKey = '__claw123_last_site_track__';
    const now = Date.now();

    try {
      const raw = sessionStorage.getItem(dedupeKey);
      if (raw) {
        const last = JSON.parse(raw) as { path?: string; ts?: number };
        if (last.path === path && typeof last.ts === 'number' && now - last.ts < 1000) {
          return;
        }
      }
      sessionStorage.setItem(dedupeKey, JSON.stringify({ path, ts: now }));
    } catch {}

    fetch('/api/analytics/site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
