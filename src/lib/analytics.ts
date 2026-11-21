import { uuidv7 } from './uuidv7';

export type AnalyticsEventType =
  | 'bookmark.add'
  | 'bookmark.remove'
  | 'bookmark.view'
  | 'booth.select'
  | 'search.query'
  | 'sidebar.tab.switch'
  | 'area.switch'
  | 'day.switch'
  | 'share.send'
  | 'item.click'
  | 'facility.click'
  | 'cta.click'
  | 'page.view';

export type AnalyticsPayload = Record<string, unknown>;

export interface AnalyticsEvent {
  eventId: string;
  userId: string;
  userAgent: string;
  timestamp: string;
  eventType: AnalyticsEventType;
  payload: AnalyticsPayload;
}

export interface AnalyticsProvider {
  name: string;
  /**
   * Send an event. Should never throw synchronously; failures are handled
   * internally or returned as a rejected promise.
   */
  send: (event: AnalyticsEvent) => void | Promise<void>;
}

const USER_ID_KEY = 'icd-2026-analytics-user-id';
const QUEUE_KEY = 'icd-2026-analytics-queue';
const LAST_FLUSH_KEY = 'icd-2026-analytics-last-flush';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getUserId(): string {
  if (!isBrowser()) return uuidv7();
  try {
    let id = window.localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = uuidv7();
      window.localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    return uuidv7();
  }
}

function readQueue(): AnalyticsEvent[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: AnalyticsEvent[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-200)));
  } catch {
    // Storage might be full or disabled; drop silently.
  }
}

function enqueue(event: AnalyticsEvent) {
  const queue = readQueue();
  queue.push(event);
  writeQueue(queue);
}

function dequeueSent(eventId: string) {
  const queue = readQueue().filter((e) => e.eventId !== eventId);
  writeQueue(queue);
}

/**
 * HTTP provider suitable for an HTTP-to-Kafka proxy (Confluent REST Proxy,
 * Kafka Connect HTTP Source, etc.). Uses `navigator.sendBeacon` first so the
 * request does not hang the main thread and survives page unload.
 */
export function createHttpProvider(endpoint: string): AnalyticsProvider {
  return {
    name: 'http-kafka-proxy',
    send(event) {
      const payload = JSON.stringify(event);
      const blob = new Blob([payload], { type: 'application/json' });

      // sendBeacon is non-blocking and reliable on page unload.
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, blob)) {
        return Promise.resolve();
      }

      // Fallback: fetch with keepalive, also non-blocking.
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
      });
    },
  };
}

const consoleProvider: AnalyticsProvider = {
  name: 'console',
  send(event) {
    // eslint-disable-next-line no-console
    console.log('[analytics]', event);
  },
};

/**
 * Default provider: logs to console + queues in localStorage.
 * Replace with `createHttpProvider('/api/analytics')` or similar when your
 * HTTP-to-Kafka gateway is ready.
 */
export const defaultProvider: AnalyticsProvider = {
  name: 'default-queue',
  send(event) {
    try {
      consoleProvider.send(event);
    } catch {
      // Ignore console failures.
    }
    enqueue(event);
  },
};

function getPublicEnv(key: string): string | undefined {
  try {
    const meta = (import.meta as unknown as { env?: Record<string, string> }).env;
    return meta?.[key];
  } catch {
    return undefined;
  }
}

const analyticsEndpoint = getPublicEnv('PUBLIC_ANALYTICS_ENDPOINT');

let provider: AnalyticsProvider = analyticsEndpoint
  ? createHttpProvider(analyticsEndpoint)
  : defaultProvider;

export function setAnalyticsProvider(next: AnalyticsProvider) {
  provider = next;
}

export function getAnalyticsProvider(): AnalyticsProvider {
  return provider;
}

/**
 * Track an event asynchronously without blocking the main thread.
 * Failures are caught and queued for retry.
 */
export function track(eventType: AnalyticsEventType, payload: AnalyticsPayload = {}): void {
  if (!isBrowser()) return;

  const event: AnalyticsEvent = {
    eventId: uuidv7(),
    userId: getUserId(),
    userAgent: window.navigator.userAgent || '',
    timestamp: new Date().toISOString(),
    eventType,
    payload,
  };

  // Always enqueue first so the event survives provider crashes.
  enqueue(event);

  // Offload the network/provider call to the next tick so the UI stays responsive.
  Promise.resolve()
    .then(() => provider.send(event))
    .then(() => dequeueSent(event.eventId))
    .catch(() => {
      // Already enqueued; will be retried on next flush.
    });
}

/**
 * Retry all queued events. Safe to call on app init, route change, or interval.
 * Returns results so the caller can observe success/failure counts.
 */
export async function flushAnalyticsQueue(): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
}> {
  if (!isBrowser()) return { attempted: 0, succeeded: 0, failed: 0 };

  const queue = readQueue();
  if (queue.length === 0) return { attempted: 0, succeeded: 0, failed: 0 };

  const results = await Promise.allSettled(
    queue.map(async (event) => {
      await provider.send(event);
      return event.eventId;
    })
  );

  const succeededIds = new Set<string>();
  let succeeded = 0;
  let failed = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      succeededIds.add(queue[index].eventId);
      succeeded += 1;
    } else {
      failed += 1;
    }
  });

  const remaining = queue.filter((e) => !succeededIds.has(e.eventId));
  writeQueue(remaining);

  try {
    window.localStorage.setItem(LAST_FLUSH_KEY, new Date().toISOString());
  } catch {
    // Ignore storage failures.
  }

  return { attempted: queue.length, succeeded, failed };
}

/**
 * Get the current queue length. Useful for debug UI or health checks.
 */
export function getAnalyticsQueueLength(): number {
  return readQueue().length;
}

/**
 * Track a page view once per session/page load.
 */
export function trackPageView(): void {
  track('page.view', {
    href: window.location.href,
    pathname: window.location.pathname,
    referrer: document.referrer,
  });
}

// Attempt to flush any queued events when the user leaves or hides the page.
if (isBrowser()) {
  const flush = () => {
    flushAnalyticsQueue().catch(() => {
      // Ignore flush failures on unload.
    });
  };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}
