from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

# Telegram text messages are capped at 4096 characters.
MESSAGE_MAX_LEN = 4096
FIELD_MAX_LEN = 200

_pool: ConnectionPool | None = None


def require_database_url() -> str:
    url = (os.getenv("DATABASE_URL") or "").strip()
    if not url:
        raise RuntimeError(
            "DATABASE_URL is required. Set it in telegram/.env "
            "(see telegram/.env.example)."
        )
    return url


def get_pool() -> ConnectionPool:
    if _pool is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _pool


def init_db() -> None:
    """Open the connection pool and ensure schema tables exist."""
    global _pool
    if _pool is not None:
        return

    _pool = ConnectionPool(
        conninfo=require_database_url(),
        min_size=1,
        max_size=5,
        open=True,
        kwargs={"row_factory": dict_row},
    )

    with _pool.connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS telegram_chat (
                chat_id    BIGINT NOT NULL,
                user_name  TEXT NOT NULL,
                message    VARCHAR(4096) NOT NULL,
                "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS telegram_chat_chat_id_timestamp_idx
            ON telegram_chat (chat_id, "timestamp")
            """
        )
        conn.execute(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'telegram_children'
                ) AND NOT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'children_info'
                ) THEN
                    ALTER TABLE telegram_children RENAME TO children_info;
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'telegram_guardians'
                ) AND NOT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'guardians_info'
                ) THEN
                    ALTER TABLE telegram_guardians RENAME TO guardians_info;
                END IF;
            END $$;
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS children_info (
                id          BIGSERIAL PRIMARY KEY,
                chat_id     BIGINT NOT NULL,
                nickname    VARCHAR(200) NOT NULL,
                full_name   VARCHAR(200),
                school      VARCHAR(200) NOT NULL,
                class_name  VARCHAR(200) NOT NULL,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS children_info_chat_id_idx
            ON children_info (chat_id)
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS guardians_info (
                id             BIGSERIAL PRIMARY KEY,
                chat_id        BIGINT NOT NULL UNIQUE,
                guardian_name  VARCHAR(200) NOT NULL,
                contact        VARCHAR(200) NOT NULL,
                full_name      VARCHAR(200) NOT NULL,
                created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            """
            ALTER TABLE children_info
            ADD COLUMN IF NOT EXISTS access_code TEXT
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS parent_login_attempts (
                nonce           TEXT PRIMARY KEY,
                chat_id         BIGINT,
                otp_hash        TEXT,
                status          TEXT NOT NULL DEFAULT 'pending',
                attempts        INT NOT NULL DEFAULT 0,
                created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                expires_at      TIMESTAMPTZ NOT NULL,
                code_expires_at TIMESTAMPTZ
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS parent_sessions (
                token      TEXT PRIMARY KEY,
                chat_id    BIGINT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                expires_at TIMESTAMPTZ NOT NULL
            )
            """
        )


def close_db() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


def truncate_message(text: str) -> str:
    if len(text) <= MESSAGE_MAX_LEN:
        return text
    return text[:MESSAGE_MAX_LEN]


def clip_field(text: str) -> str:
    cleaned = (text or "").strip()
    if len(cleaned) <= FIELD_MAX_LEN:
        return cleaned
    return cleaned[:FIELD_MAX_LEN]


def log_chat_message(chat_id: int, user_name: str, message: str) -> None:
    """Insert one inbound chat row."""
    name = (user_name or "").strip() or "unknown"
    body = truncate_message(message or "")
    received_at = datetime.now(timezone.utc)

    with get_pool().connection() as conn:
        conn.execute(
            """
            INSERT INTO telegram_chat (chat_id, user_name, message, "timestamp")
            VALUES (%s, %s, %s, %s)
            """,
            (chat_id, name, body, received_at),
        )


@dataclass(frozen=True)
class ChildRow:
    id: int
    chat_id: int
    nickname: str
    full_name: str | None
    school: str
    class_name: str


@dataclass(frozen=True)
class GuardianRow:
    id: int
    chat_id: int
    guardian_name: str
    contact: str
    full_name: str


def insert_child(
    chat_id: int,
    nickname: str,
    full_name: str | None,
    school: str,
    class_name: str,
) -> ChildRow:
    with get_pool().connection() as conn:
        row = conn.execute(
            """
            INSERT INTO children_info
                (chat_id, nickname, full_name, school, class_name)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, chat_id, nickname, full_name, school, class_name
            """,
            (
                chat_id,
                clip_field(nickname),
                clip_field(full_name) if full_name else None,
                clip_field(school),
                clip_field(class_name),
            ),
        ).fetchone()
    assert row is not None
    return ChildRow(**row)


def list_children(chat_id: int) -> list[ChildRow]:
    with get_pool().connection() as conn:
        rows = conn.execute(
            """
            SELECT id, chat_id, nickname, full_name, school, class_name
            FROM children_info
            WHERE chat_id = %s
            ORDER BY id
            """,
            (chat_id,),
        ).fetchall()
    return [ChildRow(**row) for row in rows]


def get_child(child_id: int, chat_id: int) -> ChildRow | None:
    with get_pool().connection() as conn:
        row = conn.execute(
            """
            SELECT id, chat_id, nickname, full_name, school, class_name
            FROM children_info
            WHERE id = %s AND chat_id = %s
            """,
            (child_id, chat_id),
        ).fetchone()
    return ChildRow(**row) if row else None


def update_child(
    child_id: int,
    chat_id: int,
    nickname: str,
    full_name: str | None,
    school: str,
    class_name: str,
) -> ChildRow | None:
    with get_pool().connection() as conn:
        row = conn.execute(
            """
            UPDATE children_info
            SET nickname = %s,
                full_name = %s,
                school = %s,
                class_name = %s,
                updated_at = NOW()
            WHERE id = %s AND chat_id = %s
            RETURNING id, chat_id, nickname, full_name, school, class_name
            """,
            (
                clip_field(nickname),
                clip_field(full_name) if full_name else None,
                clip_field(school),
                clip_field(class_name),
                child_id,
                chat_id,
            ),
        ).fetchone()
    return ChildRow(**row) if row else None


def upsert_guardian(
    chat_id: int,
    guardian_name: str,
    contact: str,
    full_name: str,
) -> GuardianRow:
    with get_pool().connection() as conn:
        row = conn.execute(
            """
            INSERT INTO guardians_info
                (chat_id, guardian_name, contact, full_name)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (chat_id) DO UPDATE SET
                guardian_name = EXCLUDED.guardian_name,
                contact = EXCLUDED.contact,
                full_name = EXCLUDED.full_name,
                updated_at = NOW()
            RETURNING id, chat_id, guardian_name, contact, full_name
            """,
            (
                chat_id,
                clip_field(guardian_name),
                clip_field(contact),
                clip_field(full_name),
            ),
        ).fetchone()
    assert row is not None
    return GuardianRow(**row)


def get_guardian(chat_id: int) -> GuardianRow | None:
    with get_pool().connection() as conn:
        row = conn.execute(
            """
            SELECT id, chat_id, guardian_name, contact, full_name
            FROM guardians_info
            WHERE chat_id = %s
            """,
            (chat_id,),
        ).fetchone()
    return GuardianRow(**row) if row else None


def hash_login_otp(nonce: str, otp: str) -> str:
    """Must match server/parent.ts hashOtp: sha256(`${nonce}:${otp}`)."""
    import hashlib

    return hashlib.sha256(f"{nonce}:{otp}".encode("utf-8")).hexdigest()


def issue_login_otp(nonce: str, chat_id: int) -> tuple[str | None, str]:
    """
    Bind chat_id to a pending web login and store a new OTP hash.
    Returns (otp, error_message). otp is set on success.
    """
    import secrets
    from datetime import timedelta

    otp = f"{secrets.randbelow(10_000):04d}"
    otp_hash = hash_login_otp(nonce, otp)
    code_expires = datetime.now(timezone.utc) + timedelta(minutes=5)

    with get_pool().connection() as conn:
        row = conn.execute(
            """
            SELECT status, expires_at
            FROM parent_login_attempts
            WHERE nonce = %s
            """,
            (nonce,),
        ).fetchone()
        if row is None:
            return None, "This login link was not found. Go back to the website and try again."

        status = str(row["status"])
        expires_at = row["expires_at"]
        if status == "used":
            return None, "This login link was already used. Start again on the website."
        if status == "locked":
            return None, "This login was locked. Start again on the website."
        if expires_at is not None and expires_at < datetime.now(timezone.utc):
            conn.execute(
                """
                UPDATE parent_login_attempts
                SET status = 'expired'
                WHERE nonce = %s
                """,
                (nonce,),
            )
            return None, "This login link expired. Start again on the website."

        conn.execute(
            """
            UPDATE parent_login_attempts
            SET chat_id = %s,
                otp_hash = %s,
                status = 'code_sent',
                attempts = 0,
                code_expires_at = %s
            WHERE nonce = %s
            """,
            (chat_id, otp_hash, code_expires, nonce),
        )

    return otp, ""
