/**
 * Browser-side storage for the child's access_code.
 *
 * Only the opaque access_code is persisted as the active pointer — nicknames
 * and install metadata are keyed per access_code so multiple Tippy Home Screen
 * icons on one device do not overwrite each other (same-origin storage is shared).
 */

import {
  STORAGE_KEY_ACCESS_CODE,
  STORAGE_KEY_INSTALLATION_ID,
  STORAGE_KEY_LAST_LAUNCH_AT,
  STORAGE_KEY_PENDING_ACCESS_CODE,
  STORAGE_KEY_PENDING_USER_ID,
  STORAGE_KEY_USER_ID,
  installationIdStorageKey,
  isValidAccessCode,
  lastLaunchAtStorageKey,
  manifestHrefFor,
  normalizeAccessCode,
} from './userId';

function readStorage(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    return value && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode / quota exceeded: the session just won't persist.
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

/** True when running from an installed Home Screen icon rather than a tab. */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;

  // Older iOS reports standalone here rather than via a display-mode query.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean })
    .standalone;
  if (iosStandalone === true) return true;

  if (!window.matchMedia) return false;
  return ['standalone', 'fullscreen', 'minimal-ui'].some(
    (mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
  );
}

function readActiveAccessCode(): string | null {
  const modern = readStorage(STORAGE_KEY_ACCESS_CODE);
  if (isValidAccessCode(modern)) return normalizeAccessCode(modern);

  // Legacy installs stored the URL token under tippy_user_id.
  const legacy = readStorage(STORAGE_KEY_USER_ID);
  return isValidAccessCode(legacy) ? normalizeAccessCode(legacy) : null;
}

/**
 * Called from /launch/{access_code}. Commits the code the installed icon was
 * built for and stamps the launch so support can tell a stale icon from a fresh one.
 */
export function rememberLaunch(accessCode: string): void {
  const normalized = normalizeAccessCode(accessCode);
  writeStorage(STORAGE_KEY_ACCESS_CODE, normalized);
  writeStorage(STORAGE_KEY_USER_ID, normalized); // keep legacy key in sync
  writeStorage(lastLaunchAtStorageKey(normalized), new Date().toISOString());
  // Legacy unscoped key — last launch only; prefer scoped keys for multi-install.
  writeStorage(STORAGE_KEY_LAST_LAUNCH_AT, new Date().toISOString());
  ensureInstallationId(normalized);
}

/**
 * Called from /u/{access_code} while still in Safari. If iOS ever launches the
 * icon at "/" instead of the manifest start_url, /play can still recover the code.
 */
export function rememberPendingAccessCode(accessCode: string): void {
  const normalized = normalizeAccessCode(accessCode);
  writeStorage(STORAGE_KEY_PENDING_ACCESS_CODE, normalized);
  writeStorage(STORAGE_KEY_PENDING_USER_ID, normalized);
}

/** @deprecated Use rememberPendingAccessCode */
export const rememberPendingUserId = rememberPendingAccessCode;

export function getPendingAccessCode(): string | null {
  const modern = readStorage(STORAGE_KEY_PENDING_ACCESS_CODE);
  if (isValidAccessCode(modern)) return normalizeAccessCode(modern);

  const legacy = readStorage(STORAGE_KEY_PENDING_USER_ID);
  return isValidAccessCode(legacy) ? normalizeAccessCode(legacy) : null;
}

/** @deprecated Use getPendingAccessCode */
export const getPendingUserId = getPendingAccessCode;

/** Promotes a pending access code to the active session and returns it. */
export function promotePendingAccessCode(): string | null {
  const pending = getPendingAccessCode();
  if (!pending) return null;

  writeStorage(STORAGE_KEY_ACCESS_CODE, pending);
  writeStorage(STORAGE_KEY_USER_ID, pending);
  ensureInstallationId(pending);
  return pending;
}

/** @deprecated Use promotePendingAccessCode */
export const promotePendingUserId = promotePendingAccessCode;

export function ensureInstallationId(accessCode?: string): string | null {
  const code =
    accessCode && isValidAccessCode(accessCode)
      ? normalizeAccessCode(accessCode)
      : readActiveAccessCode();

  if (code) {
    const scopedKey = installationIdStorageKey(code);
    const existingScoped = readStorage(scopedKey);
    if (existingScoped) return existingScoped;

    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `inst-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    writeStorage(scopedKey, generated);
    // Legacy unscoped key for older support tooling.
    writeStorage(STORAGE_KEY_INSTALLATION_ID, generated);
    return generated;
  }

  const existing = readStorage(STORAGE_KEY_INSTALLATION_ID);
  if (existing) return existing;

  const generated =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `inst-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  writeStorage(STORAGE_KEY_INSTALLATION_ID, generated);
  return generated;
}

/** Drop per-child session keys for one access_code (does not wipe other children). */
export function clearScopedSession(accessCode: string): void {
  const normalized = normalizeAccessCode(accessCode);
  removeStorage(installationIdStorageKey(normalized));
  removeStorage(lastLaunchAtStorageKey(normalized));

  const active = readActiveAccessCode();
  if (active === normalized) {
    removeStorage(STORAGE_KEY_ACCESS_CODE);
    removeStorage(STORAGE_KEY_USER_ID);
    removeStorage(STORAGE_KEY_INSTALLATION_ID);
    removeStorage(STORAGE_KEY_LAST_LAUNCH_AT);
  }
}

/**
 * Repoints <link rel="manifest"> at the per-child manifest.
 *
 * In production the Express install route already ships this link in the HTML;
 * this keeps the dev server (and `vite preview`, which has no Express in front
 * of it) behaving the same way.
 */
export function applyDynamicManifestLink(accessCode: string): void {
  const href = manifestHrefFor(normalizeAccessCode(accessCode));

  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }

  if (link.getAttribute('href') !== href) {
    link.setAttribute('href', href);
  }
}

export { readActiveAccessCode };
