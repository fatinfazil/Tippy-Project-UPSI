import { Pool, type PoolClient } from 'pg';
import { ensureParentSchema } from './parent.ts';

export interface ChildRow {
  user_id: string;
  access_code: string;
  nickname: string;
  full_name: string;
  school: string;
}

export interface QuizResultRow {
  id: number;
  quiz_id: string;
  user_id: string;
  question_id: string;
  score: number;
  last_modified_at: string | null;
}

export interface GameScoreRow {
  id: number;
  game_id: string;
  user_id: string;
  score: number;
  last_modified_at: string | null;
}

export type ProgressActivityType = 'scene' | 'game' | 'quiz';

export interface ProgressRow {
  id: number;
  user_id: string;
  activity_type: ProgressActivityType;
  activity_id: string;
  phase_id: string | null;
  last_modified_at: string | null;
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id                BIGSERIAL PRIMARY KEY,
      quiz_id           TEXT NOT NULL,
      user_id           TEXT NOT NULL REFERENCES children(user_id) ON DELETE CASCADE,
      question_id       TEXT NOT NULL,
      score             INTEGER NOT NULL,
      last_modified_at  TIMESTAMPTZ,
      UNIQUE (quiz_id, user_id, question_id)
    );

    CREATE INDEX IF NOT EXISTS quiz_results_user_id_idx
      ON quiz_results (user_id);

    CREATE INDEX IF NOT EXISTS quiz_results_quiz_user_idx
      ON quiz_results (quiz_id, user_id);
  `);

  // Migrate older quiz_results that used created_at / updated_at.
  await pool.query(`
    ALTER TABLE quiz_results
    ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quiz_results' AND column_name = 'updated_at'
      ) THEN
        EXECUTE 'UPDATE quiz_results
          SET last_modified_at = COALESCE(last_modified_at, updated_at, created_at)
          WHERE last_modified_at IS NULL';
      END IF;
    END $$;
  `);
  await pool.query(`
    ALTER TABLE quiz_results DROP COLUMN IF EXISTS created_at
  `);
  await pool.query(`
    ALTER TABLE quiz_results DROP COLUMN IF EXISTS updated_at
  `);
  await pool.query(`
    ALTER TABLE quiz_results
    ALTER COLUMN last_modified_at DROP NOT NULL
  `);
  await pool.query(`
    ALTER TABLE quiz_results
    ALTER COLUMN last_modified_at DROP DEFAULT
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_scores (
      id                BIGSERIAL PRIMARY KEY,
      game_id           TEXT NOT NULL,
      user_id           TEXT NOT NULL REFERENCES children(user_id) ON DELETE CASCADE,
      score             INTEGER NOT NULL,
      last_modified_at  TIMESTAMPTZ,
      UNIQUE (game_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS game_scores_user_id_idx
      ON game_scores (user_id);

    CREATE INDEX IF NOT EXISTS game_scores_game_user_idx
      ON game_scores (game_id, user_id);
  `);

  // Existing installs may have last_modified_at as NOT NULL DEFAULT NOW().
  await pool.query(`
    ALTER TABLE game_scores
    ALTER COLUMN last_modified_at DROP NOT NULL
  `);
  await pool.query(`
    ALTER TABLE game_scores
    ALTER COLUMN last_modified_at DROP DEFAULT
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS progress (
      id                BIGSERIAL PRIMARY KEY,
      user_id           TEXT NOT NULL UNIQUE
                          REFERENCES children(user_id) ON DELETE CASCADE,
      activity_type     TEXT NOT NULL,
      activity_id       TEXT NOT NULL,
      phase_id          TEXT,
      last_modified_at  TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS progress_user_id_idx
      ON progress (user_id);
  `);

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

function mapQuizResultRow(row: {
  id: string | number;
  quiz_id: string;
  user_id: string;
  question_id: string;
  score: string | number;
  last_modified_at: Date | string | null;
}): QuizResultRow {
  return {
    id: Number(row.id),
    quiz_id: String(row.quiz_id),
    user_id: String(row.user_id),
    question_id: String(row.question_id),
    score: Number(row.score),
    last_modified_at:
      row.last_modified_at == null
        ? null
        : row.last_modified_at instanceof Date
          ? row.last_modified_at.toISOString()
          : String(row.last_modified_at),
  };
}

/** Upsert one question score for a child (keyed by quiz_id + user_id + question_id). */
export async function upsertQuizResult(input: {
  userId: string;
  quizId: string;
  questionId: string;
  score: number;
}): Promise<QuizResultRow> {
  const result = await getPool().query({
    text: `
      INSERT INTO quiz_results (quiz_id, user_id, question_id, score, last_modified_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (quiz_id, user_id, question_id)
      DO UPDATE SET 
score = GREATEST(game_scores.score, EXCLUDED.score),
last_modified_at = NOW()
      RETURNING id, quiz_id, user_id, question_id, score, last_modified_at
    `,
    values: [input.quizId, input.userId, input.questionId, input.score],
  });

  return mapQuizResultRow(result.rows[0]);
}

/** List quiz results for a child, optionally filtered by quiz_id. */
export async function listQuizResults(input: {
  userId: string;
  quizId?: string;
}): Promise<QuizResultRow[]> {
  const params: string[] = [input.userId];
  let sql = `
    SELECT id, quiz_id, user_id, question_id, score, last_modified_at
    FROM quiz_results
    WHERE user_id = $1
  `;

  if (input.quizId) {
    params.push(input.quizId);
    sql += ` AND quiz_id = $2`;
  }

  sql += ` ORDER BY quiz_id ASC, question_id ASC`;

  const result = await getPool().query(sql, params);
  return result.rows.map(mapQuizResultRow);
}

/** Sum of scores for one child on one quiz. */
export async function getQuizTotalScore(
  userId: string,
  quizId: string,
): Promise<number> {
  const result = await getPool().query<{ total_score: string }>(
    `SELECT COALESCE(SUM(score), 0)::text AS total_score
     FROM quiz_results
     WHERE quiz_id = $1 AND user_id = $2`,
    [quizId, userId],
  );
  return Number(result.rows[0]?.total_score ?? 0);
}

function mapGameScoreRow(row: {
  id: string | number;
  game_id: string;
  user_id: string;
  score: string | number;
  last_modified_at: Date | string | null;
}): GameScoreRow {
  return {
    id: Number(row.id),
    game_id: String(row.game_id),
    user_id: String(row.user_id),
    score: Number(row.score),
    last_modified_at:
      row.last_modified_at == null
        ? null
        : row.last_modified_at instanceof Date
          ? row.last_modified_at.toISOString()
          : String(row.last_modified_at),
  };
}

/** Upsert one game score for a child (keyed by game_id + user_id). */
export async function upsertGameScore(input: {
  userId: string;
  gameId: string;
  score: number;
}): Promise<GameScoreRow> {
  const result = await getPool().query({
text: `
INSERT INTO game_scores
(
 game_id,
 user_id,
 score,
 last_modified_at
)

VALUES
(
 $1,
 $2,
 $3,
 NOW()
)

ON CONFLICT(game_id,user_id)

DO UPDATE SET

score = GREATEST(
 game_scores.score,
 EXCLUDED.score
),

last_modified_at = NOW()

RETURNING id, game_id, user_id, score, last_modified_at
`,
values:[
 input.gameId,
 input.userId,
 input.score
],
});

  return mapGameScoreRow(result.rows[0]);
}

/** List game scores for a child, optionally filtered by game_id. */
export async function listGameScores(input: {
  userId: string;
  gameId?: string;
}): Promise<GameScoreRow[]> {
  const params: string[] = [input.userId];
  let sql = `
    SELECT id, game_id, user_id, score, last_modified_at
    FROM game_scores
    WHERE user_id = $1
  `;

  if (input.gameId) {
    params.push(input.gameId);
    sql += ` AND game_id = $2`;
  }

  sql += ` ORDER BY game_id ASC`;

  const result = await getPool().query(sql, params);
  return result.rows.map(mapGameScoreRow);
}

const PROGRESS_ACTIVITY_TYPES = new Set<ProgressActivityType>([
  'scene',
  'game',
  'quiz',
]);

export function isProgressActivityType(
  value: unknown,
): value is ProgressActivityType {
  return typeof value === 'string' && PROGRESS_ACTIVITY_TYPES.has(value as ProgressActivityType);
}

function mapProgressRow(row: {
  id: string | number;
  user_id: string;
  activity_type: string;
  activity_id: string;
  phase_id: string | null;
  last_modified_at: Date | string | null;
}): ProgressRow {
  const activityType = isProgressActivityType(row.activity_type)
    ? row.activity_type
    : 'scene';

  return {
    id: Number(row.id),
    user_id: String(row.user_id),
    activity_type: activityType,
    activity_id: String(row.activity_id),
    phase_id: row.phase_id == null ? null : String(row.phase_id),
    last_modified_at:
      row.last_modified_at == null
        ? null
        : row.last_modified_at instanceof Date
          ? row.last_modified_at.toISOString()
          : String(row.last_modified_at),
  };
}

/** Upsert the resume bookmark for a child (one row per user_id). */
export async function upsertProgress(input: {
  userId: string;
  activityType: ProgressActivityType;
  activityId: string;
  phaseId?: string | null;
}): Promise<ProgressRow> {
  const phaseId =
    input.phaseId == null || input.phaseId.trim() === ''
      ? null
      : input.phaseId.trim();

  const result = await getPool().query({
    text: `
      INSERT INTO progress (user_id, activity_type, activity_id, phase_id, last_modified_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        activity_type = EXCLUDED.activity_type,
        activity_id = EXCLUDED.activity_id,
        phase_id = EXCLUDED.phase_id,
        last_modified_at = NOW()
      RETURNING id, user_id, activity_type, activity_id, phase_id, last_modified_at
    `,
    values: [input.userId, input.activityType, input.activityId, phaseId],
  });

  return mapProgressRow(result.rows[0]);
}

/** Get the resume bookmark for a child, or null if none yet. */
export async function getProgress(userId: string): Promise<ProgressRow | null> {
  const result = await getPool().query(
    `SELECT id, user_id, activity_type, activity_id, phase_id, last_modified_at
     FROM progress
     WHERE user_id = $1`,
    [userId],
  );

  const row = result.rows[0];
  return row ? mapProgressRow(row) : null;
}
