import type { NextFunction, Request, Response } from 'express';
import { DEFAULT_MAINTENANCE_MESSAGE } from '../src/pwa/maintenance.ts';
import { readCookie } from './parent.ts';

export const MAINTENANCE_BYPASS_COOKIE = 'tippy_maintenance_bypass';
const BYPASS_MAX_AGE_SEC = 12 * 60 * 60;

const OPEN_PATHS = new Set(['/api/health', '/api/status']);

export function isMaintenanceEnabled(): boolean {
  const value = (process.env.MAINTENANCE ?? '').trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

export function maintenanceMessage(): string {
  const custom = (process.env.MAINTENANCE_MESSAGE ?? '').trim();
  return custom || DEFAULT_MAINTENANCE_MESSAGE;
}

function bypassToken(): string | null {
  const token = (process.env.MAINTENANCE_BYPASS_TOKEN ?? '').trim();
  return token.length > 0 ? token : null;
}

function requestedBypass(req: Request): string | null {
  const fromQuery = req.query.bypass;
  if (typeof fromQuery === 'string' && fromQuery.trim()) {
    return fromQuery.trim();
  }
  return readCookie(req, MAINTENANCE_BYPASS_COOKIE);
}

export function hasValidBypass(req: Request): boolean {
  const expected = bypassToken();
  if (!expected) return false;
  return requestedBypass(req) === expected;
}

export function applyBypassCookie(res: Response, req: Request): void {
  const expected = bypassToken();
  if (!expected) return;
  if (requestedBypass(req) !== expected) return;

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.append(
    'Set-Cookie',
    `${MAINTENANCE_BYPASS_COOKIE}=${encodeURIComponent(expected)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${BYPASS_MAX_AGE_SEC}${secure}`,
  );
}

export function statusPayload(req: Request): {
  maintenance: boolean;
  message: string;
} {
  const maintenance = isMaintenanceEnabled() && !hasValidBypass(req);
  return {
    maintenance,
    message: maintenanceMessage(),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Self-contained so blocked static assets cannot blank the page. */
export function maintenanceHtml(message: string): string {
  const body = escapeHtml(message);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#020617" />
  <title>Tippy is resting</title>
  <style>
    html, body { height: 100%; margin: 0; background: #020617; color: #e2e8f0;
      font-family: system-ui, sans-serif; }
    .wrap { min-height: 100dvh; display: flex; align-items: center; justify-content: center;
      padding: 1.5rem; box-sizing: border-box; }
    .card { max-width: 24rem; text-align: center; }
    .brand { color: #34d399; font-size: 0.875rem; font-weight: 600; letter-spacing: 0.04em; }
    h1 { color: #fff; font-size: 1.75rem; margin: 0.75rem 0 0; }
    p { color: #94a3b8; font-size: 1.05rem; line-height: 1.5; margin: 0.85rem 0 0; }
    button { margin-top: 1.75rem; width: 100%; border: 0; border-radius: 1rem;
      background: #10b981; color: #020617; font-size: 1.125rem; font-weight: 700;
      padding: 0.95rem 1.25rem; cursor: pointer; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <p class="brand">Tippy Wira Hijau</p>
      <h1>Tippy is resting</h1>
      <p>${body}</p>
      <button type="button" onclick="location.reload()">Try again</button>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Blocks the website and APIs while MAINTENANCE is on.
 * /api/health and /api/status stay up so PWAs and probes can see the flag.
 */
export function maintenanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isMaintenanceEnabled()) {
    next();
    return;
  }

  if (OPEN_PATHS.has(req.path)) {
    next();
    return;
  }

  if (hasValidBypass(req)) {
    applyBypassCookie(res, req);
    next();
    return;
  }

  res.set('Cache-Control', 'no-store, max-age=0');
  res.set('Retry-After', '300');

  if (req.path.startsWith('/api')) {
    res.status(503).json({
      error: 'maintenance',
      maintenance: true,
      message: maintenanceMessage(),
    });
    return;
  }

  res.status(503).type('html').send(maintenanceHtml(maintenanceMessage()));
}
