/**
 * Shared maintenance copy + client probe of /api/status.
 *
 * Installed PWAs often boot from a precached index.html and never hit the
 * Express 503 page, so every app load (and resume) must ask the network.
 */

export const DEFAULT_MAINTENANCE_MESSAGE =
  'Tippy is having a little rest. Please come back soon.';

const LAST_KNOWN_KEY = 'tippy_maintenance_last';

export interface AppStatus {
  maintenance: boolean;
  message: string;
}

function readBypassFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('bypass');
  return value && value.trim() ? value.trim() : null;
}

/** Drop ?bypass= from the address bar after it has been sent to the API. */
export function stripBypassQuery(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('bypass')) return;
  url.searchParams.delete('bypass');
  const search = url.searchParams.toString();
  window.history.replaceState(
    null,
    '',
    `${url.pathname}${search ? `?${search}` : ''}${url.hash}`,
  );
}

function rememberMaintenance(active: boolean): void {
  try {
    if (active) sessionStorage.setItem(LAST_KNOWN_KEY, '1');
    else sessionStorage.removeItem(LAST_KNOWN_KEY);
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function lastKnownMaintenance(): boolean {
  try {
    return sessionStorage.getItem(LAST_KNOWN_KEY) === '1';
  } catch {
    return false;
  }
}

export async function fetchAppStatus(): Promise<AppStatus> {
  const bypass = readBypassFromUrl();
  const href = bypass
    ? `/api/status?bypass=${encodeURIComponent(bypass)}`
    : '/api/status';

  try {
    const res = await fetch(href, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) {
      throw new Error(`status ${res.status}`);
    }

    const data = (await res.json()) as {
      maintenance?: unknown;
      message?: unknown;
    };
    const maintenance = data.maintenance === true;
    const message =
      typeof data.message === 'string' && data.message.trim()
        ? data.message.trim()
        : DEFAULT_MAINTENANCE_MESSAGE;

    rememberMaintenance(maintenance);
    return { maintenance, message };
  } catch {
    // Offline: keep blocking if we already saw maintenance this session.
    const maintenance = lastKnownMaintenance();
    return { maintenance, message: DEFAULT_MAINTENANCE_MESSAGE };
  }
}
