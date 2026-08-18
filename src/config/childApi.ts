/**
 * Child identity helpers — access_code URL + API lookup against Postgres.
 *
 * Two entry points feed this:
 *  - ?u=AB7K2 for a direct browser session,
 *  - /u/AB7K2 -> /launch/AB7K2 for an installed Home Screen icon (see src/pwa).
 *
 * Once a valid access_code is loaded, it is remembered in localStorage until
 * a different ?u= / setup link is opened. user_id from the API is the internal
 * key for future score tables — it is not stored in the URL.
 *
 * Multiple Home Screen installs share the same origin storage, so nicknames
 * are keyed per access_code and the active play URL is /play/{code}.
 */

import {
  clearScopedSession,
  promotePendingAccessCode,
  readActiveAccessCode,
} from '../pwa/identity';
import {
  STORAGE_KEY_ACCESS_CODE,
  STORAGE_KEY_NICKNAME,
  STORAGE_KEY_USER_ID,
  getAccessCodeFromPath,
  nicknameStorageKey,
  normalizeAccessCode,
  parseAccessCode,
} from '../pwa/userId';

export interface Child {
  user_id: string;
  access_code: string;
  nickname: string;
  full_name: string;
  school: string;
}

export const PLACEHOLDER_CHILD_NAME = 'xxx';

/** Read `u` from the current page URL (e.g. ?u=AB7K2) as an access_code. */
export function getAccessCodeFromUrl(
  search: string = window.location.search,
): string | null {
  const raw = new URLSearchParams(search).get('u');
  return parseAccessCode(raw);
}

/** @deprecated Use getAccessCodeFromUrl */
export const getUidFromUrl = getAccessCodeFromUrl;

export function getSavedAccessCode(): string | null {
  return readActiveAccessCode();
}

/** @deprecated Use getSavedAccessCode */
export const getSavedUserId = getSavedAccessCode;

export function getSavedNickname(accessCode?: string | null): string | null {
  try {
    if (accessCode && parseAccessCode(accessCode)) {
      const scoped = localStorage.getItem(
        nicknameStorageKey(normalizeAccessCode(accessCode)),
      );
      if (scoped && scoped.trim()) return scoped.trim();
    }

    // Legacy single-slot nickname (pre multi-install).
    const legacy = localStorage.getItem(STORAGE_KEY_NICKNAME);
    return legacy && legacy.trim() ? legacy.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Prefer path (/play|/launch|/u), then ?u=, then saved session, then a pending
 * code left by the install page — the last covers an iOS icon that launched at
 * "/" instead of the manifest start_url.
 */
export function resolveActiveAccessCode(): string | null {
  return (
    getAccessCodeFromPath() ??
    getAccessCodeFromUrl() ??
    getSavedAccessCode() ??
    promotePendingAccessCode()
  );
}

/** @deprecated Use resolveActiveAccessCode */
export const resolveActiveUserId = resolveActiveAccessCode;

export function saveChildSession(accessCode: string, nickname: string): void {
  try {
    const normalized = normalizeAccessCode(accessCode);
    localStorage.setItem(STORAGE_KEY_ACCESS_CODE, normalized);
    localStorage.setItem(STORAGE_KEY_USER_ID, normalized);
    localStorage.setItem(nicknameStorageKey(normalized), nickname);
    // Legacy unscoped key — last active child only.
    localStorage.setItem(STORAGE_KEY_NICKNAME, nickname);
  } catch {
    // Ignore quota / private-mode failures; session just won't persist.
  }
}

export function clearChildSession(accessCode?: string | null): void {
  try {
    if (accessCode && parseAccessCode(accessCode)) {
      const normalized = normalizeAccessCode(accessCode);
      localStorage.removeItem(nicknameStorageKey(normalized));
      clearScopedSession(normalized);
      return;
    }

    localStorage.removeItem(STORAGE_KEY_ACCESS_CODE);
    localStorage.removeItem(STORAGE_KEY_USER_ID);
    localStorage.removeItem(STORAGE_KEY_NICKNAME);
  } catch {
    // Ignore
  }
}

/** Fetch child by access_code. Returns null when missing or request fails. */
export async function fetchChild(accessCode: string): Promise<Child | null> {
  const normalized = normalizeAccessCode(accessCode);
  if (!normalized) return null;

  try {
    const response = await fetch(`/api/child/${encodeURIComponent(normalized)}`);
    if (response.status === 404) return null;
    if (!response.ok) {
      console.error('Failed to fetch child:', response.status);
      return null;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      console.error('Child API returned non-JSON (is Express running?)');
      return null;
    }

    return (await response.json()) as Child;
  } catch (error) {
    console.error('Failed to fetch child:', error);
    return null;
  }
}
