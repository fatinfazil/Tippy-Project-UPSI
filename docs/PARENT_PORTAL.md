# Parent portal (`/dashboard`)

Parents/guardians log in at **`/dashboard`** using Telegram OTP, then add child Tippy accounts.

## Routing policy

Unknown paths show **Invalid URL** (no silent redirect to home).

| Path | Purpose |
|------|---------|
| `/` | Landing — **Enter Parent Dashboard** or **Play** |
| `/dashboard` | Parent portal |
| `/dashboard/children/new` | Add children account |
| `/dashboard/children/:id/edit` | Edit children account |
| `/u/{access_code}` | Child install / setup (code required & valid) |
| `/launch/{access_code}` | PWA start_url → then `/play` |
| `/play` | Story player |

**Play** on the home page opens `/u/{code}` (saved code, or prompt for one).

## Login sequence

1. Open `/dashboard` → **Login with Telegram**.
2. Web API creates a `parent_login_attempts` row (`nonce`, status `pending`) and returns  
   `https://t.me/<TELEGRAM_BOT_USERNAME>?start=login_<nonce>`.
3. Parent opens the deep link; bot handles `/start login_<nonce>`.
4. Bot binds Telegram `chat_id`, stores `sha256(nonce:otp)`, status `code_sent`, DMs a **4-digit** code (5 minutes).
5. Parent enters the code on `/dashboard` → `POST /api/parent/login/verify`.
6. On success: HttpOnly cookie `tippy_parent_session` (7 days) and dashboard.

Rate limit: 5 wrong codes → status `locked` (must start again).

## APIs

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/parent/login/start` | — | Create nonce + deep link |
| POST | `/api/parent/login/verify` | — | Check OTP; set session cookie |
| POST | `/api/parent/logout` | cookie | Clear session |
| GET | `/api/parent/me` | cookie | Profile / guardian |
| PUT | `/api/parent/me` | cookie | Edit guardian (name, contact, full name) |
| DELETE | `/api/parent/me` | cookie | Delete this parent account + linked children |
| GET | `/api/parent/children` | cookie | List children for this chat |
| POST | `/api/parent/children` | cookie | Add child (writes `children` + `children_info`) |
| PUT | `/api/parent/children/:id` | cookie | Edit child account |
| DELETE | `/api/parent/children/:id` | cookie | Delete child account |

## Tables

- `parent_login_attempts` — nonce, chat_id, otp_hash, status, attempts, expiries
- `parent_sessions` — token, chat_id, expires_at
- Uses existing `children_info`, `guardians_info`, and Tippy `children` (for `/u/{access_code}`)

## Run locally

1. Set `DATABASE_URL` and `TELEGRAM_BOT_USERNAME` in root `.env` and `telegram/.env`.
2. Start API: `npm run dev:server` (port 3001).
3. Start Vite: `npm run dev` (port 3000; `/api` proxied).
4. Start bot: `telegram/Launch_tippy_telegram.bat` or `python main.py`.
5. Open `http://localhost:3000/dashboard`.

Both the **web server** and the **Telegram bot** must share the same Postgres and be running for login to work.
