import { parseAccessCode } from './userId';

export type AppRoute =
  /** / — public landing with two entry buttons. */
  | { kind: 'home' }
  /** /u/{access_code} — child install / setup. */
  | { kind: 'install'; userId: string }
  /** /launch/{access_code} — PWA start_url; stores the code then opens play. */
  | { kind: 'launch'; userId: string }
  /** /dashboard — parent portal. */
  | { kind: 'parent'; view: 'home' }
  /** /dashboard/children/new */
  | { kind: 'parent'; view: 'child-new' }
  /** /dashboard/children/:id/edit */
  | { kind: 'parent'; view: 'child-edit'; childId: number }
  /** /play — story player; optional /play/{access_code} keeps multi-install identity in the URL. */
  | { kind: 'play'; accessCode: string | null }
  /** Any other path. */
  | { kind: 'invalid' };

/**
 * Strict public routes:
 *   / , /dashboard… , /u/{access_code}
 * Plus child runtime (needed after install):
 *   /launch/{access_code} , /play , /play/{access_code}
 * Everything else → invalid (no silent fallback to home).
 */
export function parseRoute(
  pathname: string = window.location.pathname,
): AppRoute {
  const parts = pathname.split('/').filter(Boolean);
  const [first, second, third, fourth] = parts;

  if (!first) return { kind: 'home' };

  if (first === 'u') {
    if (parts.length !== 2) return { kind: 'invalid' };
    const code = parseAccessCode(second);
    if (!code) return { kind: 'invalid' };
    return { kind: 'install', userId: code };
  }

  if (first === 'launch') {
    if (parts.length !== 2) return { kind: 'invalid' };
    const code = parseAccessCode(second);
    if (!code) return { kind: 'invalid' };
    return { kind: 'launch', userId: code };
  }

  if (first === 'dashboard') {
    if (parts.length === 1) return { kind: 'parent', view: 'home' };
    if (parts.length === 3 && second === 'children' && third === 'new') {
      return { kind: 'parent', view: 'child-new' };
    }
    if (parts.length === 4 && second === 'children' && fourth === 'edit') {
      const childId = Number(third);
      if (Number.isFinite(childId) && childId > 0) {
        return { kind: 'parent', view: 'child-edit', childId };
      }
    }
    return { kind: 'invalid' };
  }

  if (first === 'play') {
    if (parts.length === 1) return { kind: 'play', accessCode: null };
    if (parts.length === 2) {
      const code = parseAccessCode(second);
      if (!code) return { kind: 'invalid' };
      return { kind: 'play', accessCode: code };
    }
    return { kind: 'invalid' };
  }

  return { kind: 'invalid' };
}

export const HOME_PATH = '/';
export const PARENT_HOME_PATH = '/dashboard';
export const PARENT_CHILD_NEW_PATH = '/dashboard/children/new';

export function parentChildEditPath(childId: number): string {
  return `/dashboard/children/${childId}/edit`;
}
