# Maintenance mode

Flip the public website (and already-installed Home Screen apps) into a rest
screen without a code deploy.

## Turn it on / off

On the **Tippy** Railway service → **Variables**:

| Variable | On | Off |
| --- | --- | --- |
| `MAINTENANCE` | `1` (also accepts `true` / `yes` / `on`) | delete it, or set `0` |

Railway restarts the process when the variable changes. That is enough.

Optional:

| Variable | Purpose |
| --- | --- |
| `MAINTENANCE_MESSAGE` | Custom sentence on the rest screen |
| `MAINTENANCE_BYPASS_TOKEN` | Secret so you can still use the live app |

Locally, the same keys go in `.env`, then restart `npm run dev:server`.

## What visitors see

- **Browser tab:** Express returns HTTP 503 and a short “Tippy is resting” page
  (no React bundle required).
- **Installed PWA:** the icon may still boot from a cached `index.html`. The
  app then calls `/api/status` (never cached by the service worker). If
  maintenance is on, it shows the same rest screen instead of Play / dashboard.
- **Already open:** the app re-checks every 60 seconds and when it returns to
  the foreground, so a live session also parks.

`/api/health` and `/api/status` stay up so probes and PWAs can read the flag.
Every other route and API returns 503.

## Bypass (optional)

Set `MAINTENANCE_BYPASS_TOKEN` to a long random string. While maintenance is
on, open:

```
https://tippy.my/?bypass=YOUR_TOKEN
```

A cookie is stored for 12 hours so you can click around. Parents and children
without the token still see the rest screen.

## Telegram bot

This switch is **web / PWA only**. The Telegram bot is a separate service and
is not paused.
