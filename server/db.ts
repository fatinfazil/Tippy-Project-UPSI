import { Pool, type PoolClient } from 'pg';
import { ensureParentSchema } from './parent.ts';

export interface ChildRow {
  user_id: string;
  access_code: string;
  nickname: string;
  full_name: string;
  school: string;
}

let pool: Pool | null = null;

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL is required. Set it to a Postgres connection string ' +
        '(on Railway: ${{Postgres.DATABASE_URL}}).',
    );
  }
  return url;
}

/** Host portion of DATABASE_URL for health/logging (password redacted). */
export function getDbHostLabel(): string {
  try {
    const parsed = new URL(requireDatabaseUrl());
    return parsed.host || 'postgres';
  } catch {
    return 'postgres';
  }
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDb() before using the pool.');
  }
  return pool;
}

/**
 * Ensure children has access_code (unique public login token) and backfill
 * from the previous user_id values used in /u/{id} links.
 */
async function ensureAccessCodeColumn(database: Pool): Promise<void> {
  await database.query(`
    ALTER TABLE children
    ADD COLUMN IF NOT EXISTS access_code TEXT
  `);

  await database.query(`
    UPDATE children
    SET access_code = upper(trim(user_id))
    WHERE access_code IS NULL OR trim(access_code) = ''
  `);

  await database.query(`
    ALTER TABLE children
    ALTER COLUMN access_code SET NOT NULL
  `);

  await database.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS children_access_code_uidx
    ON children (access_code)
  `);
}

export async function initDb(): Promise<Pool> {
  if (pool) return pool;

  pool = new Pool({ connectionString: requireDatabaseUrl() });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS children (
      user_id     TEXT PRIMARY KEY,
      access_code TEXT NOT NULL,
      nickname    TEXT NOT NULL,
      full_name   TEXT NOT NULL,
      school      TEXT NOT NULL
    );
  `);

  await ensureAccessCodeColumn(pool);
  await ensureParentSchema();

  return pool;
}

function mapChildRow(row: ChildRow): ChildRow {
  return {
    user_id: String(row.user_id),
    access_code: String(row.access_code),
    nickname: String(row.nickname),
    full_name: String(row.full_name),
    school: String(row.school),
  };
}

/** Look up a child by the public access code used in /u/{code} links. */
export async function findChildByAccessCode(
  accessCode: string,
): Promise<ChildRow | null> {
  const normalized = accessCode.trim().toUpperCase();
  if (!normalized) return null;

  const result = await getPool().query<ChildRow>(
    `SELECT user_id, access_code, nickname, full_name, school
     FROM children
     WHERE access_code = $1`,
    [normalized],
  );

  const row = result.rows[0];
  return row ? mapChildRow(row) : null;
}

export async function seedChildrenIfEmpty(rows: ChildRow[]): Promise<number> {
  const database = getPool();
  const countResult = await database.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM children`,
  );
  const existingCount = Number(countResult.rows[0]?.count ?? 0);

  if (existingCount > 0) return 0;

  const client: PoolClient = await database.connect();
  try {
    await client.query('BEGIN');
    for (const row of rows) {
      await client.query(
        `INSERT INTO children (user_id, access_code, nickname, full_name, school)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          row.user_id,
          row.access_code.trim().toUpperCase(),
          row.nickname,
          row.full_name,
          row.school,
        ],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return rows.length;
}
