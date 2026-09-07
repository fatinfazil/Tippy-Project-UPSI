import {
  Pool,
  type PoolClient,
} from 'pg';

import {
  ensureParentSchema,
} from './parent.ts';

// ============================================
// CHILD TYPE
// ============================================

export interface ChildRow {
  user_id: string;
  access_code: string;
  nickname: string;
  full_name: string;
  school: string;
}

// ============================================
// QUIZ TYPES
// ============================================

export interface QuizAnswerInput {
  questionId: number;
  selectedOptionId:
    | 'A'
    | 'B'
    | 'C';
  isCorrect: boolean;
}

export interface QuizResultInput {
  userId: string;
  quizId: string;
  answers: QuizAnswerInput[];
}

export interface QuizResultRow {
  id: string;
  quiz_id: string;
  user_id: string;
  question_id: string;
  score: number;
  last_modified_at: string;
}

export interface QuizAttemptRow {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  completed_at: string;
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

// ============================================
// DATABASE POOL
// ============================================

let pool: Pool | null = null;

// ============================================
// DATABASE URL
// ============================================

function requireDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL?.trim();

  if (!url) {
    throw new Error(
      'DATABASE_URL is required. ' +
        'Set it to a Postgres connection string ' +
        '(on Railway: ${{Postgres.DATABASE_URL}}).'
    );
  }

  return url;
}

// ============================================
// DATABASE HOST LABEL
// ============================================

export function getDbHostLabel(): string {
  try {
    const parsed = new URL(
      requireDatabaseUrl()
    );

    return parsed.host || 'postgres';
  } catch {
    return 'postgres';
  }
}

// ============================================
// GET DATABASE POOL
// ============================================

export function getPool(): Pool {
  if (!pool) {
    throw new Error(
      'Database not initialized. ' +
        'Call initDb() before using the pool.'
    );
  }

  return pool;
}

// ============================================
// ENSURE ACCESS CODE COLUMN
// ============================================

async function ensureAccessCodeColumn(
  database: Pool
): Promise<void> {
  await database.query(`
    ALTER TABLE children
    ADD COLUMN IF NOT EXISTS
      access_code TEXT
  `);

  await database.query(`
    UPDATE children
    SET access_code =
      upper(trim(user_id))
    WHERE access_code IS NULL
       OR trim(access_code) = ''
  `);

  await database.query(`
    ALTER TABLE children
    ALTER COLUMN access_code
    SET NOT NULL
  `);

  await database.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS
      children_access_code_uidx
    ON children(access_code)
  `);
}

// ============================================
// ENSURE QUIZ RESULTS TABLE
// ============================================

async function ensureQuizResultsTable(
  database: Pool
): Promise<void> {

  await database.query(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id BIGSERIAL PRIMARY KEY,

      quiz_id TEXT NOT NULL,

      user_id TEXT NOT NULL
        REFERENCES children(user_id)
        ON DELETE CASCADE,

      question_id TEXT NOT NULL,

      score INTEGER NOT NULL,

      last_modified_at TIMESTAMPTZ
        DEFAULT NOW(),

      UNIQUE (
        quiz_id,
        user_id,
        question_id
      )
    );
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS
      quiz_results_user_id_idx
    ON quiz_results(user_id);
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS
      quiz_results_quiz_user_idx
    ON quiz_results(
      quiz_id,
      user_id
    );
  `);
}

// ============================================
// ENSURE QUIZ ATTEMPTS TABLE
// ============================================

async function ensureQuizAttemptsTable(
  database: Pool
): Promise<void> {

  await database.query(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id BIGSERIAL PRIMARY KEY,

      quiz_id TEXT NOT NULL,

      user_id TEXT NOT NULL
        REFERENCES children(user_id)
        ON DELETE CASCADE,

      score INTEGER NOT NULL,

      completed_at TIMESTAMPTZ
        DEFAULT NOW()
    );
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS
      quiz_attempts_user_quiz_idx
    ON quiz_attempts(
      user_id,
      quiz_id
    );
  `);
}

// ============================================
// ENSURE GAME SCORES TABLE
// ============================================

async function ensureGameScoresTable(
  database: Pool
): Promise<void> {
  await database.query(`
    CREATE TABLE IF NOT EXISTS game_scores (
      id BIGSERIAL PRIMARY KEY,

      game_id TEXT NOT NULL,

      user_id TEXT NOT NULL
        REFERENCES children(user_id)
        ON DELETE CASCADE,

      score INTEGER NOT NULL,

      last_modified_at TIMESTAMPTZ,

      UNIQUE (game_id, user_id)
    );
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS
      game_scores_user_id_idx
    ON game_scores(user_id);
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS
      game_scores_game_user_idx
    ON game_scores(
      game_id,
      user_id
    );
  `);

  await database.query(`
    ALTER TABLE game_scores
    ALTER COLUMN last_modified_at
    DROP NOT NULL
  `);

  await database.query(`
    ALTER TABLE game_scores
    ALTER COLUMN last_modified_at
    DROP DEFAULT
  `);
}

// ============================================
// ENSURE PROGRESS TABLE
// ============================================

async function ensureProgressTable(
  database: Pool
): Promise<void> {
  await database.query(`
    CREATE TABLE IF NOT EXISTS progress (
      id BIGSERIAL PRIMARY KEY,

      user_id TEXT NOT NULL UNIQUE
        REFERENCES children(user_id)
        ON DELETE CASCADE,

      activity_type TEXT NOT NULL,

      activity_id TEXT NOT NULL,

      phase_id TEXT,

      last_modified_at TIMESTAMPTZ
    );
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS
      progress_user_id_idx
    ON progress(user_id);
  `);
}

// ============================================
// INITIALIZE DATABASE
// ============================================

export async function initDb(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString:
      requireDatabaseUrl(),
  });

  // ==========================================
  // CREATE CHILDREN TABLE
  // ==========================================

  await pool.query(`
    CREATE TABLE IF NOT EXISTS children (
      user_id     TEXT PRIMARY KEY,
      access_code TEXT NOT NULL,
      nickname    TEXT NOT NULL,
      full_name   TEXT NOT NULL,
      school      TEXT NOT NULL
    );
  `);

  // ==========================================
  // ENSURE ACCESS CODES
  // ==========================================

  await ensureAccessCodeColumn(pool);

  // ==========================================
  // CREATE / UPGRADE QUIZ TABLE
  // ==========================================

  await ensureQuizResultsTable(pool);

  await ensureQuizAttemptsTable(pool);

  await ensureGameScoresTable(pool);

  await ensureProgressTable(pool);

  // ==========================================
  // CREATE / UPGRADE PARENT TABLES
  // ==========================================

  await ensureParentSchema();

  return pool;
}

// ============================================
// MAP CHILD ROW
// ============================================

function mapChildRow(
  row: ChildRow
): ChildRow {
  return {
    user_id:
      String(row.user_id),

    access_code:
      String(row.access_code),

    nickname:
      String(row.nickname),

    full_name:
      String(row.full_name),

    school:
      String(row.school),
  };
}

// ============================================
// FIND CHILD BY ACCESS CODE
// ============================================

export async function findChildByAccessCode(
  accessCode: string
): Promise<ChildRow | null> {

  const normalized =
    accessCode
      .trim()
      .toUpperCase();

  if (!normalized) {
    return null;
  }

  const result =
    await getPool().query<ChildRow>(
      `
        SELECT
          user_id,
          access_code,
          nickname,
          full_name,
          school
        FROM children
        WHERE access_code = $1
      `,
      [normalized]
    );

  const row =
    result.rows[0];

  return row
    ? mapChildRow(row)
    : null;
}

// ============================================
// SEED CHILDREN
// ============================================

export async function seedChildrenIfEmpty(
  rows: ChildRow[]
): Promise<number> {

  const database =
    getPool();

  const countResult =
    await database.query<{
      count: string;
    }>(
      `
        SELECT
          COUNT(*)::text AS count
        FROM children
      `
    );

  const existingCount =
    Number(
      countResult.rows[0]?.count ??
        0
    );

  if (existingCount > 0) {
    return 0;
  }

  const client: PoolClient =
    await database.connect();

  try {

    await client.query(
      'BEGIN'
    );

    for (const row of rows) {

      await client.query(
        `
          INSERT INTO children (
            user_id,
            access_code,
            nickname,
            full_name,
            school
          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
          )
        `,
        [
          row.user_id,

          row.access_code
            .trim()
            .toUpperCase(),

          row.nickname,

          row.full_name,

          row.school,
        ]
      );

    }

    await client.query(
      'COMMIT'
    );

  } catch (error) {

    await client.query(
      'ROLLBACK'
    );

    throw error;

  } finally {

    client.release();

  }

  return rows.length;
}

// ============================================
// SAVE QUIZ RESULT
// ============================================

export async function saveQuizResult(
  input: QuizResultInput
): Promise<QuizResultRow[]> {

  const database =
    getPool();

  const client =
    await database.connect();

  const savedResults:
    QuizResultRow[] = [];

  try {

    await client.query(
      'BEGIN'
    );

    // ========================================
    // SAVE EACH ANSWER
    // ========================================

    for (
      const answer of input.answers
    ) {

      const result =
        await client.query<QuizResultRow>(
          `
            INSERT INTO quiz_results (
              quiz_id,
              user_id,
              question_id,
              score,
              last_modified_at
            )

            VALUES (
              $1,
              $2,
              $3,
              $4,
              NOW()
            )

            ON CONFLICT (
              quiz_id,
              user_id,
              question_id
            )

            DO UPDATE SET

              score =
                EXCLUDED.score,

              last_modified_at =
                NOW()

            RETURNING
              id,
              quiz_id,
              user_id,
              question_id,
              score,
              last_modified_at
          `,
          [
            input.quizId,

            input.userId,

            String(
              answer.questionId
            ),

            answer.isCorrect
              ? 10
              : 0,
          ]
        );

      // ======================================
      // STORE SAVED ROW
      // ======================================

      const saved =
        result.rows[0];

      if (saved) {

        savedResults.push(
          saved
        );

      }

    }

    // ========================================
    // SAVE QUIZ ATTEMPT SUMMARY
    // ========================================

    const totalScore =
      input.answers.reduce(
        (total, answer) =>
          total + (answer.isCorrect ? 10 : 0),
        0
      );

    await client.query(
      `
        INSERT INTO quiz_attempts (
          quiz_id,
          user_id,
          score
        )

        VALUES (
          $1,
          $2,
          $3
        )
      `,
      [
        input.quizId,
        input.userId,
        totalScore,
      ]
    );

    // ========================================
    // COMMIT
    // ========================================

    await client.query(
      'COMMIT'
    );

    // ========================================
    // RETURN SAVED RESULTS
    // ========================================

    return savedResults;

  } catch (error) {

    await client.query(
      'ROLLBACK'
    );

    throw error;

  } finally {

    client.release();

  }
}

// ============================================
// GET BEST QUIZ SCORE
// ============================================

export async function getBestQuizScore(
  userId: string,
  quizId: string
): Promise<number> {

  const result =
    await getPool().query(
      `
      SELECT
        MAX(score) AS best_score

      FROM quiz_attempts

      WHERE user_id = $1
      AND quiz_id = $2
      `,
      [
        userId,
        quizId,
      ]
    );

  return Number(
    result.rows[0]?.best_score ?? 0
  );
}

// ============================================
// MAP GAME SCORE ROW
// ============================================

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

// ============================================
// UPSERT GAME SCORE
// ============================================

/** Upsert one game score for a child (keyed by game_id + user_id). */
export async function upsertGameScore(input: {
  userId: string;
  gameId: string;
  score: number;
}): Promise<GameScoreRow> {
  const result = await getPool().query({
    text: `
      INSERT INTO game_scores (
        game_id,
        user_id,
        score,
        last_modified_at
      )
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (game_id, user_id)
      DO UPDATE SET
        score = GREATEST(
          game_scores.score,
          EXCLUDED.score
        ),
        last_modified_at = NOW()
      RETURNING
        id,
        game_id,
        user_id,
        score,
        last_modified_at
    `,
    values: [input.gameId, input.userId, input.score],
  });

  return mapGameScoreRow(result.rows[0]);
}

// ============================================
// LIST GAME SCORES
// ============================================

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
  return (
    typeof value === 'string' &&
    PROGRESS_ACTIVITY_TYPES.has(value as ProgressActivityType)
  );
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

// ============================================
// UPSERT PROGRESS
// ============================================

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
      INSERT INTO progress (
        user_id,
        activity_type,
        activity_id,
        phase_id,
        last_modified_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        activity_type = EXCLUDED.activity_type,
        activity_id = EXCLUDED.activity_id,
        phase_id = EXCLUDED.phase_id,
        last_modified_at = NOW()
      RETURNING
        id,
        user_id,
        activity_type,
        activity_id,
        phase_id,
        last_modified_at
    `,
    values: [
      input.userId,
      input.activityType,
      input.activityId,
      phaseId,
    ],
  });

  return mapProgressRow(result.rows[0]);
}

// ============================================
// GET PROGRESS
// ============================================

/** Get the resume bookmark for a child, or null if none yet. */
export async function getProgress(
  userId: string
): Promise<ProgressRow | null> {
  const result = await getPool().query(
    `
      SELECT
        id,
        user_id,
        activity_type,
        activity_id,
        phase_id,
        last_modified_at
      FROM progress
      WHERE user_id = $1
    `,
    [userId]
  );

  const row = result.rows[0];
  return row ? mapProgressRow(row) : null;
}

