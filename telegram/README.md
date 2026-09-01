# Tippy Telegram Bot

Standalone Python service for **@TippyWiraHijauBot**. It greets users (Malaysia time), shows menus, collects children/guardian registration, and logs every inbound text message to Postgres.

## Stack

- Python 3.11+ (tested with 3.14)
- [python-telegram-bot](https://python-telegram-bot.org/) (long polling + ConversationHandler)
- [psycopg](https://www.psycopg.org/) + Railway / Postgres via `DATABASE_URL`
- Secrets in `telegram/.env` (gitignored); template in `.env.example`

## Layout

```
telegram/
  main.py                 # entry: load env, init DB, start bot
  db.py                   # pool, schema, CRUD helpers
  handlers/
    menu.py               # greeting + main / register menus
    register.py           # register / edit child + guardian flows
    logging.py            # log every text message to DB
  requirements.txt
  .env.example
  Launch_tippy_telegram.bat
  README.md               # this file
```

## Setup

1. Copy env template and fill real values (never commit `.env`):

   ```text
   copy .env.example .env
   ```

   | Variable | Purpose |
   |----------|---------|
   | `TELEGRAM_BOT_TOKEN` | BotFather token for TippyWiraHijauBot |
   | `DATABASE_URL` | Postgres connection string (e.g. Railway) |

2. Create a venv and install deps (or use the launcher bat):

   ```powershell
   cd telegram
   python -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

3. Run:

   - Double-click `Launch_tippy_telegram.bat`, or
   - `.\.venv\Scripts\python.exe main.py`

4. In Telegram, message **@TippyWiraHijauBot**.

## Bot behaviour

### Greeting (Hi / Hello)

- Trigger: message **starts with** `Hi` or `Hello` (case-insensitive, word boundary).
- Reply uses **Asia/Kuala_Lumpur** local time:

  | Local hour (MYT) | Greeting |
  |------------------|----------|
  | 00:00–11:59 | Good morning |
  | 12:00–17:59 | Good afternoon |
  | 18:00–23:59 | Good evening |

- Format: `Good <period> <first_name>, I am Tippy!!` then the main menu.

### Main menu (reply keyboard)

| Account | View |
| Help | Survey |

- **Account** — opens the Account submenu (below).
- **View / Survey** — placeholders (“coming soon”).
- **Help** — short how-to.

### Account submenu

| Register Children Details |
| Edit Children Details |
| Guardian or Parent Contact |
| Back to Main Menu |

#### 1) Register Children Details → table `children_info`

Prompts in order:

1. Nickname (required)
2. Full name (optional — send `-` to skip)
3. School (required)
4. Class (required)

Send **Cancel** at any step to abort and return to the Account submenu.

#### 2) Edit Children Details → same table `children_info`

- If no children: asks user to register first.
- If one child: edits that child.
- If several: ask to pick by number, then edit.
- Prompts Nickname → Full name → School → Class.
- Send `-` to keep the current value (for optional full name, `-` keeps existing).

#### 3) Guardian or Parent Contact → table `guardians_info`

- One guardian row per Telegram `chat_id` (upsert).
- Prompts: guardian name → contact → full name.
- If a row already exists, shows current values; send `-` to keep a field.

### Invalid input

Any other text (not greeting, not a known menu button, not inside a form):

> Sorry I don't understand your request, please choose the following options.

Then the main menu is shown again.

### Chat logging

Every inbound **text** message is written to `telegram_chat` (handler group `-1`).

## Database tables

Created automatically on bot startup (`CREATE TABLE IF NOT EXISTS`).

### `telegram_chat`

| Column | Type | Notes |
|--------|------|--------|
| `chat_id` | `BIGINT` | Telegram chat id |
| `user_name` | `TEXT` | `@username` or display name |
| `message` | `VARCHAR(4096)` | Truncated to Telegram’s max length |
| `timestamp` | `TIMESTAMPTZ` | UTC time received |

### `children_info`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `BIGSERIAL` | Primary key |
| `chat_id` | `BIGINT` | Telegram user who registered |
| `nickname` | `VARCHAR(200)` | Required |
| `full_name` | `VARCHAR(200)` | Optional (nullable) |
| `school` | `VARCHAR(200)` | Required |
| `class_name` | `VARCHAR(200)` | Required (“Class”) |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

### `guardians_info`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `BIGSERIAL` | Primary key |
| `chat_id` | `BIGINT` | Unique — one guardian contact per chat |
| `guardian_name` | `VARCHAR(200)` | |
| `contact` | `VARCHAR(200)` | Phone / WhatsApp / etc. |
| `full_name` | `VARCHAR(200)` | |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

Useful queries:

```sql
SELECT * FROM children_info WHERE chat_id = <id> ORDER BY id;
SELECT * FROM guardians_info WHERE chat_id = <id>;
SELECT * FROM telegram_chat ORDER BY "timestamp" DESC LIMIT 20;
```

## Secrets & git

- Commit `.env.example` (placeholders only).
- Never commit `.env` or `.venv/` (root `.gitignore`).
- Do not paste live tokens or DB passwords into docs or example files.

## Parent web portal

Parents can also log in on the Tippy website at **`/dashboard`** (Telegram 4-digit OTP). See [docs/PARENT_PORTAL.md](../docs/PARENT_PORTAL.md).

The bot handles `/start login_<nonce>` and DMs the code. Web server and bot must share the same `DATABASE_URL`.
