/**
 * Opaque per-child access code shared by the setup link, the dynamic manifest
 * and the launch route.
 *
 * access_code is the public token in /u/{code}. user_id is the internal DB key
 * used for future FK tables — they are not the same field.
 *
 * This module is deliberately free of DOM and React imports so the Express
 * server can import it directly and keep a single source of truth for the
 * validation rules.
 */

/**
 * Production codes must be random and opaque. The lower bound keeps the seeded
 * demo codes (AB7K2, DEMO1) valid while rejecting single-character junk.
 */
export const ACCESS_CODE_PATTERN = /^[A-Za-z0-9_-]{4,100}$/;

/** @deprecated Use ACCESS_CODE_PATTERN */
export const USER_ID_PATTERN = ACCESS_CODE_PATTERN;

/** Session stores the public access_code (legacy key name kept for installs). */
export const STORAGE_KEY_ACCESS_CODE = 'tippy_access_code';
export const STORAGE_KEY_USER_ID = 'tippy_user_id';
export const STORAGE_KEY_NICKNAME = 'tippy_nickname';
export const STORAGE_KEY_PENDING_ACCESS_CODE = 'tippy_pending_access_code';
export const STORAGE_KEY_PENDING_USER_ID = 'tippy_pending_user_id';
export const STORAGE_KEY_LAST_LAUNCH_AT = 'tippy_last_launch_at';
export const STORAGE_KEY_INSTALLATION_ID = 'tippy_installation_id';

/** Path the PWA lands on once a launch has stored the access_code. */
export const PLAY_PATH = '/play';

/** Per-child localStorage keys — same-origin PWAs share storage, so values must be scoped. */
export function nicknameStorageKey(accessCode: string): string {
  return `${STORAGE_KEY_NICKNAME}_${normalizeAccessCode(accessCode)}`;
}

export function installationIdStorageKey(accessCode: string): string {
  return `${STORAGE_KEY_INSTALLATION_ID}_${normalizeAccessCode(accessCode)}`;
}

export function lastLaunchAtStorageKey(accessCode: string): string {
  return `${STORAGE_KEY_LAST_LAUNCH_AT}_${normalizeAccessCode(accessCode)}`;
}

/** Codes are matched case-insensitively; storage and lookups use upper case. */
export function normalizeAccessCode(value: string): string {
  return value.trim().toUpperCase();
}

/** @deprecated Use normalizeAccessCode */
export const normalizeUserId = normalizeAccessCode;

export function isValidAccessCode(value: unknown): value is string {
  return typeof value === 'string' && ACCESS_CODE_PATTERN.test(value.trim());
}

/** @deprecated Use isValidAccessCode */
export const isValidUserId = isValidAccessCode;

/**
 * Accepts a raw path segment or query value and returns the normalized access
 * code, or null when it fails validation.
 */
export function parseAccessCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  let candidate = value.trim();
  try {
    candidate = decodeURIComponent(candidate).trim();
  } catch {
    // Malformed percent-encoding: fall through and validate the raw value.
  }

  return isValidAccessCode(candidate) ? normalizeAccessCode(candidate) : null;
}

/** @deprecated Use parseAccessCode */
export const parseUserId = parseAccessCode;

export function installPathFor(accessCode: string): string {
  return `/u/${encodeURIComponent(accessCode)}`;
}

export function launchPathFor(accessCode: string): string {
  return `/launch/${encodeURIComponent(accessCode)}`;
}

/** In-session play URL that keeps the child identity in the path (not only localStorage). */
export function playPathFor(accessCode: string): string {
  return `/play/${encodeURIComponent(normalizeAccessCode(accessCode))}`;
}

export function manifestHrefFor(accessCode: string): string {
  return `/api/manifest?access_code=${encodeURIComponent(accessCode)}`;
}

/**
 * Pull an access_code from /play/{code}, /launch/{code}, or /u/{code}.
 * Used so multiple Home Screen icons on one device do not overwrite each other.
 */
export function getAccessCodeFromPath(
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '',
): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  if (parts[0] === 'play' || parts[0] === 'launch' || parts[0] === 'u') {
    return parseAccessCode(parts[1]);
  }
  return null;
}
