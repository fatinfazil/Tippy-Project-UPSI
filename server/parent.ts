import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { getPool } from './db.ts';

export const PARENT_SESSION_COOKIE = 'tippy_parent_session';

const NONCE_TTL_MS = 10 * 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export type LoginStatus =
  | 'pending'
  | 'code_sent'
  | 'used'
  | 'expired'
  | 'locked';

export interface ParentLoginAttempt {
  nonce: string;
  chat_id: string | null;
  otp_hash: string | null;
  status: LoginStatus;
  attempts: number;
  created_at: Date;
  expires_at: Date;
  code_expires_at: Date | null;
}

export interface ParentSession {
  token: string;
  chat_id: string;
  created_at: Date;
  expires_at: Date;
}

export interface ChildrenInfoRow {
  id: number;
  chat_id: string;
  nickname: string;
  full_name: string | null;
  school: string;
  class_name: string;
  access_code: string | null;
}

export interface GuardianInfoRow {
  chat_id: string;
  guardian_name: string;
  contact: string;
  full_name: string;
}

/** Shared with the Telegram bot: sha256(`${nonce}:${otp}`). */
export function hashOtp(nonce: string, otp: string): string {
  return createHash('sha256').update(`${nonce}:${otp}`, 'utf8').digest('hex');
}

export function safeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length || bufA.length === 0) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString('base64url');
}

function generateAccessCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const buf = randomBytes(5);
  for (let i = 0; i < 5; i++) {
    code += alphabet[buf[i]! % alphabet.length];
  }
  return code;
}

export async function ensureParentSchema(): Promise<void> {
  const database = getPool();

  await database.query(`
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
  `);
  await database.query(`
    CREATE INDEX IF NOT EXISTS children_info_chat_id_idx
    ON children_info (chat_id)
  `);
  await database.query(`
    ALTER TABLE children_info
    ADD COLUMN IF NOT EXISTS access_code TEXT
  `);

  await database.query(`
    CREATE TABLE IF NOT EXISTS guardians_info (
      id             BIGSERIAL PRIMARY KEY,
      chat_id        BIGINT NOT NULL UNIQUE,
      guardian_name  VARCHAR(200) NOT NULL,
      contact        VARCHAR(200) NOT NULL,
      full_name      VARCHAR(200) NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await database.query(`
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
  `);

  await database.query(`
    CREATE TABLE IF NOT EXISTS parent_sessions (
      token      TEXT PRIMARY KEY,
      chat_id    BIGINT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    )
  `);
  await database.query(`
    CREATE INDEX IF NOT EXISTS parent_sessions_chat_id_idx
    ON parent_sessions (chat_id)
  `);
}

export function getTelegramBotUsername(): string {
  const name = (process.env.TELEGRAM_BOT_USERNAME || 'TippyWiraHijauBot').trim();
  return name.replace(/^@/, '');
}

export async function createLoginAttempt(): Promise<{
  nonce: string;
  deepLink: string;
  expiresAt: string;
}> {
  const nonce = randomToken(18);
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);
  await getPool().query(
    `INSERT INTO parent_login_attempts (nonce, status, expires_at)
     VALUES ($1, 'pending', $2)`,
    [nonce, expiresAt],
  );
  const bot = getTelegramBotUsername();
  return {
    nonce,
    deepLink: `https://t.me/${bot}?start=login_${nonce}`,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getLoginAttempt(
  nonce: string,
): Promise<ParentLoginAttempt | null> {
  const result = await getPool().query(
    `SELECT nonce, chat_id::text, otp_hash, status, attempts,
            created_at, expires_at, code_expires_at
     FROM parent_login_attempts WHERE nonce = $1`,
    [nonce],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    nonce: String(row.nonce),
    chat_id: row.chat_id == null ? null : String(row.chat_id),
    otp_hash: row.otp_hash == null ? null : String(row.otp_hash),
    status: String(row.status) as LoginStatus,
    attempts: Number(row.attempts),
    created_at: new Date(row.created_at),
    expires_at: new Date(row.expires_at),
    code_expires_at: row.code_expires_at
      ? new Date(row.code_expires_at)
      : null,
  };
}

export type VerifyLoginResult =
  | { ok: true; sessionToken: string; chatId: string }
  | { ok: false; error: string; status: number };

export async function verifyLoginCode(
  nonce: string,
  code: string,
): Promise<VerifyLoginResult> {
  const cleaned = code.trim();
  if (!/^\d{4}$/.test(cleaned)) {
    return { ok: false, error: 'Enter the 4-digit code from Telegram.', status: 400 };
  }

  const attempt = await getLoginAttempt(nonce);
  if (!attempt) {
    return { ok: false, error: 'Login session not found. Start again.', status: 404 };
  }

  const now = Date.now();
  if (attempt.status === 'used') {
    return { ok: false, error: 'This login link was already used.', status: 410 };
  }
  if (attempt.status === 'locked') {
    return { ok: false, error: 'Too many attempts. Start login again.', status: 429 };
  }
  if (attempt.expires_at.getTime() < now) {
    await getPool().query(
      `UPDATE parent_login_attempts SET status = 'expired' WHERE nonce = $1`,
      [nonce],
    );
    return { ok: false, error: 'Login expired. Start again.', status: 410 };
  }
  if (attempt.status !== 'code_sent' || !attempt.otp_hash || !attempt.chat_id) {
    return {
      ok: false,
      error: 'Open Telegram with the login link first, then enter the code.',
      status: 400,
    };
  }
  if (
    !attempt.code_expires_at ||
    attempt.code_expires_at.getTime() < now
  ) {
    return { ok: false, error: 'Code expired. Start login again.', status: 410 };
  }

  const expected = hashOtp(nonce, cleaned);
  if (!safeEqualHex(expected, attempt.otp_hash)) {
    const nextAttempts = attempt.attempts + 1;
    const locked = nextAttempts >= MAX_OTP_ATTEMPTS;
    await getPool().query(
      `UPDATE parent_login_attempts
       SET attempts = $2, status = $3
       WHERE nonce = $1`,
      [nonce, nextAttempts, locked ? 'locked' : 'code_sent'],
    );
    return {
      ok: false,
      error: locked
        ? 'Too many attempts. Start login again.'
        : 'Incorrect code. Try again.',
      status: locked ? 429 : 401,
    };
  }

  const sessionToken = randomToken(32);
  const sessionExpires = new Date(Date.now() + SESSION_TTL_MS);
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE parent_login_attempts SET status = 'used' WHERE nonce = $1`,
      [nonce],
    );
    await client.query(
      `INSERT INTO parent_sessions (token, chat_id, expires_at)
       VALUES ($1, $2, $3)`,
      [sessionToken, attempt.chat_id, sessionExpires],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return { ok: true, sessionToken, chatId: attempt.chat_id };
}

export async function getSessionByToken(
  token: string,
): Promise<ParentSession | null> {
  const result = await getPool().query(
    `SELECT token, chat_id::text, created_at, expires_at
     FROM parent_sessions WHERE token = $1`,
    [token],
  );
  const row = result.rows[0];
  if (!row) return null;
  const session: ParentSession = {
    token: String(row.token),
    chat_id: String(row.chat_id),
    created_at: new Date(row.created_at),
    expires_at: new Date(row.expires_at),
  };
  if (session.expires_at.getTime() < Date.now()) {
    await getPool().query(`DELETE FROM parent_sessions WHERE token = $1`, [
      token,
    ]);
    return null;
  }
  return session;
}

export async function deleteSession(token: string): Promise<void> {
  await getPool().query(`DELETE FROM parent_sessions WHERE token = $1`, [token]);
}

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rest.join('=').trim());
    }
  }
  return null;
}

export function setSessionCookie(res: Response, token: string): void {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${PARENT_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
  );
}

export function clearSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${PARENT_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  );
}

export async function requireParentSession(
  req: Request,
): Promise<ParentSession | null> {
  const token = readCookie(req, PARENT_SESSION_COOKIE);
  if (!token) return null;
  return getSessionByToken(token);
}

export async function getGuardian(
  chatId: string,
): Promise<GuardianInfoRow | null> {
  const result = await getPool().query(
    `SELECT chat_id::text, guardian_name, contact, full_name
     FROM guardians_info WHERE chat_id = $1`,
    [chatId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    chat_id: String(row.chat_id),
    guardian_name: String(row.guardian_name),
    contact: String(row.contact),
    full_name: String(row.full_name),
  };
}

export async function upsertGuardianForParent(
  chatId: string,
  input: { name: string; contact: string; fullName: string },
): Promise<GuardianInfoRow> {
  const guardianName = input.name.trim().slice(0, 200);
  const contact = input.contact.trim().slice(0, 200);
  const fullName = input.fullName.trim().slice(0, 200);
  if (!guardianName || !contact || !fullName) {
    throw new Error('Guardian name, contact, and full name are required.');
  }

  const result = await getPool().query(
    `INSERT INTO guardians_info (chat_id, guardian_name, contact, full_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (chat_id) DO UPDATE SET
       guardian_name = EXCLUDED.guardian_name,
       contact = EXCLUDED.contact,
       full_name = EXCLUDED.full_name,
       updated_at = NOW()
     RETURNING chat_id::text, guardian_name, contact, full_name`,
    [chatId, guardianName, contact, fullName],
  );
  const row = result.rows[0];
  return {
    chat_id: String(row.chat_id),
    guardian_name: String(row.guardian_name),
    contact: String(row.contact),
    full_name: String(row.full_name),
  };
}

export async function deleteParentAccount(chatId: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const kids = await client.query<{ access_code: string | null }>(
      `SELECT access_code FROM children_info WHERE chat_id = $1`,
      [chatId],
    );
    for (const kid of kids.rows) {
      if (kid.access_code) {
        await client.query(`DELETE FROM children WHERE access_code = $1`, [
          kid.access_code,
        ]);
      }
    }

    await client.query(`DELETE FROM children_info WHERE chat_id = $1`, [chatId]);
    await client.query(`DELETE FROM guardians_info WHERE chat_id = $1`, [
      chatId,
    ]);
    await client.query(`DELETE FROM parent_sessions WHERE chat_id = $1`, [
      chatId,
    ]);
    await client.query(`DELETE FROM parent_login_attempts WHERE chat_id = $1`, [
      chatId,
    ]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listChildrenInfo(
  chatId: string,
): Promise<ChildrenInfoRow[]> {
  const result = await getPool().query(
    `SELECT id, chat_id::text, nickname, full_name, school, class_name, access_code
     FROM children_info
     WHERE chat_id = $1
     ORDER BY id`,
    [chatId],
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    chat_id: String(row.chat_id),
    nickname: String(row.nickname),
    full_name: row.full_name == null ? null : String(row.full_name),
    school: String(row.school),
    class_name: String(row.class_name),
    access_code: row.access_code == null ? null : String(row.access_code),
  }));
}

function mapChildrenInfoRow(row: Record<string, unknown>): ChildrenInfoRow {
  return {
    id: Number(row.id),
    chat_id: String(row.chat_id),
    nickname: String(row.nickname),
    full_name: row.full_name == null ? null : String(row.full_name),
    school: String(row.school),
    class_name: String(row.class_name),
    access_code: row.access_code == null ? null : String(row.access_code),
  };
}

export async function addChildForParent(
  chatId: string,
  input: {
    nickname: string;
    fullName?: string | null;
    school: string;
    className: string;
  },
): Promise<ChildrenInfoRow> {
  const nickname = input.nickname.trim().slice(0, 200);
  const fullName = (input.fullName || '').trim().slice(0, 200) || null;
  const school = input.school.trim().slice(0, 200);
  const className = input.className.trim().slice(0, 200);
  if (!nickname || !school || !className) {
    throw new Error('Nickname, school, and class are required.');
  }

  let accessCode = generateAccessCode();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < 8; i++) {
      const exists = await client.query(
        `SELECT 1 FROM children WHERE access_code = $1`,
        [accessCode],
      );
      if (exists.rowCount === 0) break;
      accessCode = generateAccessCode();
    }

    const userId = `tg_${chatId}_${Date.now().toString(36)}`;
    await client.query(
      `INSERT INTO children (user_id, access_code, nickname, full_name, school)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, accessCode, nickname, fullName || nickname, school],
    );

    const info = await client.query(
      `INSERT INTO children_info
         (chat_id, nickname, full_name, school, class_name, access_code)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, chat_id::text, nickname, full_name, school, class_name, access_code`,
      [chatId, nickname, fullName, school, className, accessCode],
    );

    await client.query('COMMIT');
    return mapChildrenInfoRow(info.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateChildForParent(
  chatId: string,
  childId: number,
  input: {
    nickname: string;
    fullName?: string | null;
    school: string;
    className: string;
  },
): Promise<ChildrenInfoRow | null> {
  const nickname = input.nickname.trim().slice(0, 200);
  const fullName = (input.fullName || '').trim().slice(0, 200) || null;
  const school = input.school.trim().slice(0, 200);
  const className = input.className.trim().slice(0, 200);
  if (!nickname || !school || !className) {
    throw new Error('Nickname, school, and class are required.');
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT id, access_code FROM children_info
       WHERE id = $1 AND chat_id = $2`,
      [childId, chatId],
    );
    if (existing.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const accessCode = existing.rows[0].access_code as string | null;

    const info = await client.query(
      `UPDATE children_info
       SET nickname = $3,
           full_name = $4,
           school = $5,
           class_name = $6,
           updated_at = NOW()
       WHERE id = $1 AND chat_id = $2
       RETURNING id, chat_id::text, nickname, full_name, school, class_name, access_code`,
      [childId, chatId, nickname, fullName, school, className],
    );

    if (accessCode) {
      await client.query(
        `UPDATE children
         SET nickname = $2, full_name = $3, school = $4
         WHERE access_code = $1`,
        [accessCode, nickname, fullName || nickname, school],
      );
    }

    await client.query('COMMIT');
    return mapChildrenInfoRow(info.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteChildForParent(
  chatId: string,
  childId: number,
): Promise<boolean> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT access_code FROM children_info
       WHERE id = $1 AND chat_id = $2`,
      [childId, chatId],
    );
    if (existing.rowCount === 0) {
      await client.query('ROLLBACK');
      return false;
    }
    const accessCode = existing.rows[0].access_code as string | null;

    await client.query(
      `DELETE FROM children_info WHERE id = $1 AND chat_id = $2`,
      [childId, chatId],
    );
    if (accessCode) {
      await client.query(`DELETE FROM children WHERE access_code = $1`, [
        accessCode,
      ]);
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/** OTP TTL used by the bot when sending codes (exported for docs). */
export const PARENT_OTP_TTL_MS = OTP_TTL_MS;
