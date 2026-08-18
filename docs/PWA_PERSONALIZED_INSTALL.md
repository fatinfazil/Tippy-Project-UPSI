# Personalized PWA install

## The problem this solves

Tippy is added to the iPhone/iPad Home Screen so it opens full screen without
Safari's chrome. Before this change every install shared one static manifest
whose `start_url` was `/`, so the installed icon always reopened the generic
home route. The child's `access_code` was lost and the app could not personalize
the session.

The fix is a **per-child manifest**: the install page hands Safari a manifest
whose `start_url` points at that child's launch route, with a **unique `id`**
so several Tippy icons can live on one device (siblings / classroom tablets).

## Multiple installs on one device

Browsers treat `manifest.id` as the install identity. Tippy sets:

| Field | Value | Why |
| --- | --- | --- |
| `id` | `/tippy/{access_code}` | Distinct app per child |
| `name` / `short_name` | Nickname (fallback: code) | Icons are distinguishable |
| `start_url` | `/launch/{access_code}` | Icon always opens that child |
| `scope` | `/` | Shared SPA assets |

Same-origin PWAs still **share localStorage**, so Tippy also:

1. Keeps play identity in the URL: `/play/{access_code}` after launch.
2. Scopes nickname / install metadata keys per access_code.

Without both pieces, installing child B would overwrite child A's session.

## Route flow

| Route | Served by | Purpose |
| --- | --- | --- |
| `/u/{access_code}` | Express (`server/index.ts`) + `InstallPage.tsx` | Landing page with two buttons, **Play** and **Install**. Ships `<link rel="manifest" href="/api/manifest?access_code={access_code}">`. |
| `/api/manifest?access_code={access_code}` | Express (`server/manifest.ts`) | Per-child manifest. Unique `id`, personalized name, `start_url: /launch/{access_code}`. |
| `/launch/{access_code}` | SPA (`LaunchPage.tsx`) | The manifest `start_url`. Saves the code, then rewrites to `/play/{code}`. |
| `/play/{access_code}` | SPA (`StoryPlayer.tsx`) | The game for that child (path wins over localStorage). |
| `/play` | SPA (`StoryPlayer.tsx`) | Fallback: last active / pending code only. |

```
parent opens /u/AB7K2
      -> Add to Home Screen
      -> Safari reads /api/manifest?access_code=AB7K2
      -> icon installed with id /tippy/AB7K2, start_url /launch/AB7K2

child taps icon
      -> /launch/AB7K2  (saves tippy_access_code + scoped keys)
      -> /play/AB7K2    (loads AB7K2's profile)

sibling installs /u/DEMO1 on the same phone
      -> second icon with id /tippy/DEMO1
      -> opens /launch/DEMO1 -> /play/DEMO1 without wiping AB7K2's scoped data
```

## localStorage keys

| Key | Written by | Purpose |
| --- | --- | --- |
| `tippy_access_code` | `/launch/{code}` | Last active child (pointer). |
| `tippy_user_id` | `/launch/{code}` | Legacy mirror of the access code (older installs). |
| `tippy_pending_access_code` | `/u/{code}` | Recovery copy saved while still in Safari. |
| `tippy_last_launch_at_{CODE}` | `/launch/{code}` | ISO timestamp per child. |
| `tippy_installation_id_{CODE}` | `/launch/{code}` | Random UUID per child install. |
| `tippy_nickname_{CODE}` | `/play` | Cached display name for that child. |

Legacy unscoped keys (`tippy_nickname`, `tippy_installation_id`,
`tippy_last_launch_at`) are still written for the last active child so older
support tooling keeps working.

Only opaque `access_code` values and greeting nicknames are stored client-side.
Internal `user_id` stays in Postgres for future FK tables. School / full name /
contact details are never placed in the URL or the manifest.

## The landing page

`/u/{access_code}` looks the child up through `/api/child/{access_code}` as soon as it
loads and greets them by nickname: *"Hello Aina, welcome."*

If the lookup fails — unknown code, missing nickname, or the API is
unreachable — the page shows *"Oops, please contact support"* and **both
buttons stay disabled**, so nobody installs an icon for a code that will not
work. Note this means the landing page requires the Express API to be running;
`vite preview` alone is not enough.

Once the child is confirmed, the page offers exactly two buttons:

- **Play** — stores the `access_code` and nickname, then goes straight to
  `/play/{access_code}`. Nothing is installed; useful for a quick try in the browser.
- **Install** — behaviour depends on the platform:
  - **Android / Chromium**: raises the native install prompt. The page captures
    `beforeinstallprompt` on load and suppresses Chrome's own banner so the
    button controls the moment. Once installed, the button reads "Installed".
  - **iPhone / iPad**: Safari exposes no install API, so tapping Install
    reveals the Add to Home Screen steps below the buttons.
  - **Any other browser**: falls back to generic "use your browser menu" steps.

Either way the page has already pointed `<link rel="manifest">` at
`/api/manifest?access_code={access_code}`, so an install started from here carries the
right `start_url` and unique `id`.

## iPhone / iPad install steps

1. Open the link in **Safari** (not Chrome, and not an in-app browser such as
   the one inside WhatsApp — those create a plain shortcut, not a PWA).
2. Tap **Install**.
3. Tap **Share** (square with an up arrow; bottom bar on iPhone, top bar on iPad).
4. Tap **Add to Home Screen**.
5. Tap **Add** (you can edit the label — the system may already show the child's nickname).
6. Open Tippy from the new Home Screen icon.

Repeat with a second child's `/u/{code}` link to add another Tippy icon on the
same device.

## iOS fallbacks that are handled

iOS behaviour varies by version, so three cases are covered:

- **Icon opens `/launch/{id}`** — the intended path (then `/play/{id}`).
- **Icon opens `/`** — `/play` promotes `tippy_pending_access_code` (saved by the
  install page) into `tippy_access_code`.
- **Icon opens `/u/{code}`** — some versions pin the page URL instead of the
  manifest `start_url`. `App.tsx` detects standalone display mode and treats
  the visit as a launch rather than showing setup instructions again.

If no id can be resolved, `/play` shows a child-friendly screen: *"Tippy setup
needed — Please open the setup link from your parent or teacher."* Children are
never asked for a password and never see a technical error.

## Caching rules

The manifest is user-specific, so it must never be cached:

- `/api/manifest` responds with `Cache-Control: no-store, max-age=0` and
  `Content-Type: application/manifest+json`.
- `/u/{access_code}` responds with `Cache-Control: no-store, max-age=0`.
- The service worker (`vite.config.ts`) uses `NetworkOnly` for `/api/` and
  excludes `/api/` and `/u/` from `navigateFallback`, so the precached
  `index.html` (which carries the *generic* manifest link) can never be served
  in place of the install page.
- Videos are **not** precached at install (they exceed the 3 MB precache cap).
  Opening the Home Screen icon lands on `/launch/{id}`, which stays on this
  load and shows **Getting Tippy ready...** while every video, background and
  character GIF is written into `tippy-media`. Playback uses a `blob:` URL
  from that store. If a file never made it into the cache, the video element
  streams it from the network instead.
- `src/pwa/registerUpdates.ts` reloads the page once a new worker takes
  control, and calls `registration.update()` whenever the app returns to the
  foreground. Without that, iOS Safari and Home Screen icons keep the previous
  JS bundle until the tab is force-quit. The first load after a deploy that
  introduced this helper still needs a Safari website-data clear if the old
  worker is already stuck; later deploys apply themselves.

## Launchers

| Script | What it does |
| --- | --- |
| `Launch_tippy.bat` | Dev server + API. Opens `/u/AB7K2`, the full landing page. Use this for iterating. |
| `launch_tippy_demo_aina.bat` | Dev server + API. Opens `/launch/AB7K2`, skipping the landing page and dropping straight into the game as Aina. |
| `launch_tippy_pwa.bat` | Production build served by Express on `:4173`, then runs `verify:pwa` and opens the install page. Use this to test a real install. |
| `clean_cache.bat` | Clears `dist/`, Vite cache and npm cache. Does not touch Postgres. |

`launch_tippy_pwa.bat` runs `npm start` (Express), **not** `vite preview`.
Preview serves static files only, so `/api/manifest` and `/api/child` would
both 404 and the install page would show "contact support".

All three launchers now start the API, because the landing page cannot render
its Play and Install buttons without a successful child lookup.

## Testing checklist

Automated, against a running server:

```powershell
$env:Path = "$env:USERPROFILE\node-portable\node-v24.19.0-win-x64;$env:Path"
npm run build
npm start                                      # Express on :3001 (PORT overrides)
npm run verify:pwa                             # in a second shell
npm run verify:pwa -- http://localhost:4173    # or point it anywhere
```

`launch_tippy_pwa.bat` runs this for you in the "Tippy PWA Check" window.
It asserts:

1. `/api/manifest?access_code=AB7K2` returns `id: /tippy/AB7K2`,
   `start_url: /launch/AB7K2`, `display: standalone`, `scope: /`.
2. The response uses `application/manifest+json` and `no-store`.
3. Invalid codes (`bad!id`, `ab`) return HTTP 400.
4. `/u/AB7K2` returns HTML linking `/api/manifest?access_code=AB7K2` and **not**
   `/manifest.webmanifest`.
5. Every icon path in the manifest resolves with HTTP 200.

Manual, in a desktop browser:

- `/u/AB7K2` greets "Hello Aina, welcome." with Play and Install enabled.
- `/u/ZZZZZ` (not in the database) shows "Oops, please contact support" with
  both buttons disabled.
- `/launch/AB7K2` writes `tippy_access_code` then lands on `/play/AB7K2`.
- `/play` with localStorage cleared shows the "Tippy setup needed" screen.
- Two different `/u/{code}` install flows produce two distinct `manifest.id` values.

## Manual iPad / iPhone test checklist

1. **Delete any old Tippy icon** from the Home Screen. iOS reuses the settings
   captured when the icon was first added, so an old icon will keep the old
   `start_url` / `id` no matter what the server now returns.
2. Open Safari.
3. Go to `https://tippy.my/u/AB7K2`.
4. In a separate tab, confirm `https://tippy.my/api/manifest?access_code=AB7K2`
   returns `"id": "/tippy/AB7K2"` and `"start_url": "/launch/AB7K2"`.
5. Return to `/u/AB7K2` and tap **Install** to reveal the steps.
6. Tap **Share**.
7. Tap **Add to Home Screen**.
8. Tap **Add**.
9. Close Safari completely (swipe it away from the app switcher).
10. Tap the Tippy icon on the Home Screen.
11. Expect the PWA to open `/launch/AB7K2` then `/play/AB7K2`.
12. Expect that child to be greeted by nickname.
13. Repeat steps 3–12 with a second child's code; expect a **second** Home Screen
    icon that opens the other profile.

If step 11 fails, delete the icon and clear Safari's website data for the site
before retrying — a stale icon or a stale service worker is the usual cause.

## Privacy note

Use random opaque access codes in production, for example `k7Jp92LmQxA4vR8z`. Do not use
a child's name, a school or class name, a phone number, an email address or a
sequential/predictable code. The `access_code` appears in the URL, in the manifest
and on the Home Screen icon's launch URL, so it must not be meaningful on its
own. Codes are validated against `/^[A-Za-z0-9_-]{4,100}$/` and normalized to
upper case. Internal `user_id` values are never placed in public URLs.

## Deployment notes

The dynamic manifest requires a server; a purely static host cannot serve it.
Tippy already ships an Express server (`npm start` -> `server/index.ts`), which
serves the API, the personalized install page and the built SPA from one
process, so no new infrastructure is needed.

Child identity lives in **Railway Postgres**. The Tippy service must have
`DATABASE_URL` set to `${{Postgres.DATABASE_URL}}` (or an equivalent connection
string). Local API runs (`npm run dev:server`, launchers) need the same variable
via `.env`, Docker Postgres, or `railway run`.

`vite preview` does **not** run Express, so `/api/manifest` and `/api/child`
are unavailable under it. `launch_tippy_pwa.bat` therefore uses
`npm run build` + `npm start` instead. Do the same for any manual production
test.

For device testing over the LAN, note that service workers require a secure
context, so no service worker registers over plain `http://192.168.x.x`.
Add to Home Screen and the personalized `start_url` still work, which is what
this flow needs; only offline caching is missing.
