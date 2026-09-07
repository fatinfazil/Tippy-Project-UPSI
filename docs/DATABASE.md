# Database schema

PostgreSQL on Railway. Schema is created at startup with idempotent `CREATE TABLE IF NOT EXISTS` (no migration runner).

| Source | Tables |
|--------|--------|
| [`server/db.ts`](../server/db.ts) | `children`, `quiz_results`, `game_scores`, `progress` |
| [`server/parent.ts`](../server/parent.ts) | `children_info`, `guardians_info`, `parent_login_attempts`, `parent_sessions` |
| [`telegram/db.py`](../telegram/db.py) | `telegram_chat` (also mirrors parent tables) |

`user_id` on `children` is the stable internal key. Public PWA links use `access_code`. Score and progress tables FK to `children.user_id`.

---

## Relationship overview

```
children (user_id PK, access_code unique)
  ├── quiz_results   (user_id FK)
  ├── game_scores    (user_id FK)
  └── progress       (user_id FK, unique)

children_info.access_code  ↔  children.access_code   (linked by value, no formal FK)
guardians_info.chat_id     ↔  children_info.chat_id  (Telegram parent)
parent_sessions / parent_login_attempts  (auth by chat_id)
telegram_chat  (bot message log by chat_id)
```

---

## `children`

PWA / play identity for each child.

| Column | Type | Notes |
|--------|------|--------|
| `user_id` | `TEXT` | **Primary key.** Internal stable id (e.g. `usr_aina`) |
| `access_code` | `TEXT NOT NULL` | Unique public token in `/u/{code}` links |
| `nickname` | `TEXT NOT NULL` | Display name |
| `full_name` | `TEXT NOT NULL` | |
| `school` | `TEXT NOT NULL` | |

**Indexes:** unique on `access_code` (`children_access_code_uidx`).

---

## `quiz_results`

One integer score per child, quiz, and question. Retakes upsert the same row.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `BIGSERIAL` | Primary key |
| `quiz_id` | `TEXT NOT NULL` | Quiz identifier (string, config-style) |
| `user_id` | `TEXT NOT NULL` | FK → `children(user_id)` `ON DELETE CASCADE` |
| `question_id` | `TEXT NOT NULL` | Question within that quiz |
| `score` | `INTEGER NOT NULL` | Points for that question |
| `last_modified_at` | `TIMESTAMPTZ` | Nullable; stamped on write |

**Constraints / indexes:**
- `UNIQUE (quiz_id, user_id, question_id)`
- `quiz_results_user_id_idx` on `(user_id)`
- `quiz_results_quiz_user_idx` on `(quiz_id, user_id)`

**API:** `POST/GET /api/quiz/results` (resolve child via `access_code`).

---

## `game_scores`

One score per child per game. Retakes upsert the same row.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `BIGSERIAL` | Primary key |
| `game_id` | `TEXT NOT NULL` | Game identifier |
| `user_id` | `TEXT NOT NULL` | FK → `children(user_id)` `ON DELETE CASCADE` |
| `score` | `INTEGER NOT NULL` | |
| `last_modified_at` | `TIMESTAMPTZ` | Nullable; stamped on write |

**Constraints / indexes:**
- `UNIQUE (game_id, user_id)`
- `game_scores_user_id_idx` on `(user_id)`
- `game_scores_game_user_idx` on `(game_id, user_id)`

**API:** `POST/GET /api/game/scores` (resolve child via `access_code`).

---

## `progress`

Resume bookmark: last scene, game, or quiz for each child. One row per child.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `BIGSERIAL` | Primary key |
| `user_id` | `TEXT NOT NULL` | Unique FK → `children(user_id)` `ON DELETE CASCADE` |
| `activity_type` | `TEXT NOT NULL` | `scene` \| `game` \| `quiz` |
| `activity_id` | `TEXT NOT NULL` | e.g. `scene02`, `water_droplets`, `scene01_quiz` |
| `phase_id` | `TEXT` | Optional finer position (phase / step) |
| `last_modified_at` | `TIMESTAMPTZ` | Nullable; stamped on write |

**Indexes:** `progress_user_id_idx` on `(user_id)` (also covered by unique `user_id`).

**API:** `POST/GET /api/progress` (resolve child via `access_code`).

Does **not** store scores — use `quiz_results` / `game_scores` for that.

---

## `children_info`

Parent-portal / Telegram registration of children (separate from play `children`).

| Column | Type | Notes |
|--------|------|--------|
| `id` | `BIGSERIAL` | Primary key (parent API `:id`) |
| `chat_id` | `BIGINT NOT NULL` | Telegram parent chat id |
| `nickname` | `VARCHAR(200) NOT NULL` | |
| `full_name` | `VARCHAR(200)` | Nullable |
| `school` | `VARCHAR(200) NOT NULL` | |
| `class_name` | `VARCHAR(200) NOT NULL` | |
| `access_code` | `TEXT` | Links to `children.access_code` when issued |
| `created_at` | `TIMESTAMPTZ NOT NULL` | Default `NOW()` |
| `updated_at` | `TIMESTAMPTZ NOT NULL` | Default `NOW()` |

**Indexes:** `children_info_chat_id_idx` on `(chat_id)`.

---

## `guardians_info`

Parent / guardian contact profile (one per Telegram chat).

| Column | Type | Notes |
|--------|------|--------|
| `id` | `BIGSERIAL` | Primary key |
| `chat_id` | `BIGINT NOT NULL` | Unique |
| `guardian_name` | `VARCHAR(200) NOT NULL` | |
| `contact` | `VARCHAR(200) NOT NULL` | |
| `full_name` | `VARCHAR(200) NOT NULL` | |
| `created_at` | `TIMESTAMPTZ NOT NULL` | Default `NOW()` |
| `updated_at` | `TIMESTAMPTZ NOT NULL` | Default `NOW()` |

---

## `parent_login_attempts`

Telegram OTP login sessions for the parent portal.

| Column | Type | Notes |
|--------|------|--------|
| `nonce` | `TEXT` | Primary key (login session token) |
| `chat_id` | `BIGINT` | Set when bot sends OTP |
| `otp_hash` | `TEXT` | `sha256(nonce:otp)` |
| `status` | `TEXT NOT NULL` | Default `pending` (`pending`, `code_sent`, `used`, `expired`, `locked`, …) |
| `attempts` | `INT NOT NULL` | Default `0` |
| `created_at` | `TIMESTAMPTZ NOT NULL` | Default `NOW()` |
| `expires_at` | `TIMESTAMPTZ NOT NULL` | Session expiry |
| `code_expires_at` | `TIMESTAMPTZ` | OTP expiry |

---

## `parent_sessions`

HttpOnly cookie sessions after successful parent login.

| Column | Type | Notes |
|--------|------|--------|
| `token` | `TEXT` | Primary key (cookie value) |
| `chat_id` | `BIGINT NOT NULL` | |
| `created_at` | `TIMESTAMPTZ NOT NULL` | Default `NOW()` |
| `expires_at` | `TIMESTAMPTZ NOT NULL` | |

**Indexes:** `parent_sessions_chat_id_idx` on `(chat_id)`.

---

## `telegram_chat`

Bot message log (created by the Python Telegram bot).

| Column | Type | Notes |
|--------|------|--------|
| `chat_id` | `BIGINT NOT NULL` | |
| `user_name` | `TEXT NOT NULL` | |
| `message` | `VARCHAR(4096) NOT NULL` | |
| `timestamp` | `TIMESTAMPTZ NOT NULL` | Default `NOW()` (quoted column name) |

**Indexes:** `telegram_chat_chat_id_timestamp_idx` on `(chat_id, timestamp)`.

No primary key; append-only log.

---

## Notes

- **No ORM.** Express uses `pg`; the bot uses `psycopg`.
- **IDs:** play children use `TEXT` `user_id`; parent portal children use `BIGSERIAL` `children_info.id`.
- **Auth for child writes:** always resolve `access_code` → `children.user_id` on the server; never trust a client-sent `user_id`.