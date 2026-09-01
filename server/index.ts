import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import 'dotenv/config';
import express from 'express';

import {
  findChildByAccessCode,
  getDbHostLabel,
  initDb,
  saveQuizResult,
  type QuizAnswerInput,
} from './db.ts';

import {
  addChildForParent,
  clearSessionCookie,
  createLoginAttempt,
  deleteChildForParent,
  deleteParentAccount,
  deleteSession,
  getGuardian,
  getTelegramBotUsername,
  listChildrenInfo,
  PARENT_SESSION_COOKIE,
  readCookie,
  requireParentSession,
  setSessionCookie,
  updateChildForParent,
  upsertGuardianForParent,
  verifyLoginCode,
} from './parent.ts';

import { runSeed } from './seed.ts';

import {
  buildManifest,
  injectManifestLink,
} from './manifest.ts';

import {
  applyBypassCookie,
  isMaintenanceEnabled,
  maintenanceMiddleware,
  statusPayload,
} from './maintenance.ts';

import {
  parseAccessCode,
} from '../src/pwa/userId.ts';

const PORT =
  Number(process.env.PORT) || 3001;

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

const DIST_DIR = path.resolve(
  __dirname,
  '..',
  'dist'
);

async function main(): Promise<void> {
  // ============================================
  // INITIALIZE DATABASE
  // ============================================

  await initDb();

  const inserted = await runSeed();

  if (inserted > 0) {
    console.log(
      `Seeded ${inserted} children into Postgres (${getDbHostLabel()})`
    );
  } else {
    console.log(
      `Using existing Postgres database (${getDbHostLabel()})`
    );
  }

  // ============================================
  // EXPRESS APPLICATION
  // ============================================

  const app = express();

  app.use(express.json());

  // ============================================
  // HEALTH CHECK
  // ============================================

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      db: 'postgres',
      host: getDbHostLabel(),
      maintenance:
        isMaintenanceEnabled(),
    });
  });

  // ============================================
  // SYSTEM STATUS
  // ============================================

  /**
   * Always reachable, even during maintenance,
   * so installed PWAs can learn whether the
   * application is currently resting.
   */
  app.get('/api/status', (req, res) => {
    res.set(
      'Cache-Control',
      'no-store, max-age=0'
    );

    applyBypassCookie(res, req);

    res.json(statusPayload(req));
  });

  // Apply maintenance middleware to all
  // routes declared below this line.
  app.use(maintenanceMiddleware);

  // ============================================
  // CHILD LOOKUP
  // ============================================

  app.get(
    '/api/child/:accessCode',
    async (req, res) => {
      try {
        const child =
          await findChildByAccessCode(
            req.params.accessCode
          );

        if (!child) {
          res.status(404).json({
            error: 'Child not found',
          });

          return;
        }

        res.json(child);
      } catch (error) {
        console.error(
          'Child lookup failed:',
          error
        );

        res.status(500).json({
          error: 'Database error',
        });
      }
    }
  );

  // ============================================
  // SAVE SCENE 8 QUIZ RESULT
  // ============================================

  app.post(
    '/api/quiz-results',
    async (req, res) => {
      try {
        // --------------------------------------
        // VALIDATE ACCESS CODE
        // --------------------------------------

        const accessCode =
          parseAccessCode(
            req.body?.accessCode
          );

        if (!accessCode) {
          res.status(400).json({
            error:
              'Invalid or missing access code',
          });

          return;
        }

        // Find the real internal user_id
        // using the public access code.
        const child =
          await findChildByAccessCode(
            accessCode
          );

        if (!child) {
          res.status(404).json({
            error: 'Child not found',
          });

          return;
        }

        // --------------------------------------
        // VALIDATE ANSWERS
        // --------------------------------------

        if (
          !Array.isArray(
            req.body?.answers
          )
        ) {
          res.status(400).json({
            error:
              'Answers must be an array',
          });

          return;
        }

        if (
          req.body.answers.length === 0 ||
          req.body.answers.length > 100
        ) {
          res.status(400).json({
            error:
              'Invalid number of answers',
          });

          return;
        }

        const answers: QuizAnswerInput[] =
          req.body.answers.map(
            (
              answer: unknown,
              index: number
            ) => {
              if (
                typeof answer !==
                  'object' ||
                answer === null
              ) {
                throw new Error(
                  `Invalid answer at position ${
                    index + 1
                  }`
                );
              }

              const value = answer as {
                questionId?: unknown;
                selectedOptionId?: unknown;
                isCorrect?: unknown;
              };

              const questionId = Number(
                value.questionId
              );

              const selectedOptionId =
                String(
                  value.selectedOptionId ??
                    ''
                ).toUpperCase();

              if (
                !Number.isInteger(
                  questionId
                ) ||
                questionId <= 0
              ) {
                throw new Error(
                  `Invalid question ID at position ${
                    index + 1
                  }`
                );
              }

              if (
                selectedOptionId !== 'A' &&
                selectedOptionId !== 'B' &&
                selectedOptionId !== 'C'
              ) {
                throw new Error(
                  `Invalid selected option at position ${
                    index + 1
                  }`
                );
              }

              if (
                typeof value.isCorrect !==
                'boolean'
              ) {
                throw new Error(
                  `Invalid answer result at position ${
                    index + 1
                  }`
                );
              }

              return {
                questionId,
                selectedOptionId,
                isCorrect:
                  value.isCorrect,
              };
            }
          );

        // --------------------------------------
        // PREVENT DUPLICATE QUESTIONS
        // --------------------------------------

        const questionIds = new Set(
          answers.map(
            (answer) =>
              answer.questionId
          )
        );

        if (
          questionIds.size !==
          answers.length
        ) {
          res.status(400).json({
            error:
              'Duplicate question IDs',
          });

          return;
        }

        // --------------------------------------
        // CALCULATE SCORE
        // --------------------------------------

        const totalQuestions =
          answers.length;

        const correctAnswers =
          answers.filter(
            (answer) =>
              answer.isCorrect
          ).length;

        const score =
          correctAnswers * 10;

        const percentage = Math.round(
          (score /
            (totalQuestions * 10)) *
            100
        );

        // --------------------------------------
        // CALCULATE STARS
        // --------------------------------------

        let stars = 1;

        if (percentage >= 90) {
          stars = 5;
        } else if (
          percentage >= 70
        ) {
          stars = 4;
        } else if (
          percentage >= 50
        ) {
          stars = 3;
        } else if (
          percentage >= 30
        ) {
          stars = 2;
        }

        // --------------------------------------
        // SAVE TO POSTGRESQL
        // --------------------------------------

        const savedResults =
          await saveQuizResult({
            userId:
              child.user_id,

            quizId:
              'scene08',

            answers,
          });

        // --------------------------------------
        // GET COMPLETION TIME
        // --------------------------------------

        const completedAt =
          savedResults[0]
            ?.last_modified_at
            ? new Date(
                savedResults[0]
                  .last_modified_at
              ).toISOString()
            : new Date().toISOString();

        // --------------------------------------
        // BUILD SAVED QUIZ RESULT
        // --------------------------------------

        const savedResult = {
          id:
            savedResults[0]
              ? String(
                  savedResults[0].id
                )
              : `${child.user_id}-scene08`,

          user_id:
            child.user_id,

          scene:
            'scene08',

          score,

          total_questions:
            totalQuestions,

          stars,

          answers,

          completed_at:
            completedAt,
        };

        // --------------------------------------
        // RETURN RESULT TO FRONTEND
        // --------------------------------------

        res.status(201).json({
          ok: true,
          result: savedResult,
        });

      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Could not save quiz result';

        if (
          message.startsWith(
            'Invalid'
          )
        ) {
          res.status(400).json({
            error: message,
          });

          return;
        }

        console.error(
          'Quiz result save failed:',
          error
        );

        res.status(500).json({
          error:
            'Could not save quiz result',
        });
      }
    }
  );

  // ============================================
  // PARENT LOGIN START
  // ============================================

  app.post(
    '/api/parent/login/start',
    async (_req, res) => {
      try {
        const started =
          await createLoginAttempt();

        res.json({
          nonce:
            started.nonce,

          deepLink:
            started.deepLink,

          expiresAt:
            started.expiresAt,

          botUsername:
            getTelegramBotUsername(),
        });
      } catch (error) {
        console.error(
          'Parent login start failed:',
          error
        );

        res.status(500).json({
          error:
            'Could not start login',
        });
      }
    }
  );

  // ============================================
  // PARENT LOGIN VERIFY
  // ============================================

  app.post(
    '/api/parent/login/verify',
    async (req, res) => {
      try {
        const nonce = String(
          req.body?.nonce ?? ''
        ).trim();

        const code = String(
          req.body?.code ?? ''
        ).trim();

        if (!nonce) {
          res.status(400).json({
            error:
              'Missing login session',
          });

          return;
        }

        const result =
          await verifyLoginCode(
            nonce,
            code
          );

        if (!result.ok) {
          res
            .status(result.status)
            .json({
              error:
                result.error,
            });

          return;
        }

        setSessionCookie(
          res,
          result.sessionToken
        );

        res.json({
          ok: true,
          chatId:
            result.chatId,
        });
      } catch (error) {
        console.error(
          'Parent login verify failed:',
          error
        );

        res.status(500).json({
          error:
            'Could not verify code',
        });
      }
    }
  );

  // ============================================
  // PARENT LOGOUT
  // ============================================

  app.post(
    '/api/parent/logout',
    async (req, res) => {
      const token = readCookie(
        req,
        PARENT_SESSION_COOKIE
      );

      if (token) {
        try {
          await deleteSession(
            token
          );
        } catch (error) {
          console.error(
            'Parent logout failed:',
            error
          );
        }
      }

      clearSessionCookie(res);

      res.json({
        ok: true,
      });
    }
  );

  // ============================================
  // GET PARENT INFORMATION
  // ============================================

  app.get(
    '/api/parent/me',
    async (req, res) => {
      try {
        const session =
          await requireParentSession(
            req
          );

        if (!session) {
          res.status(401).json({
            error:
              'Not logged in',
          });

          return;
        }

        const guardian =
          await getGuardian(
            session.chat_id
          );

        res.json({
          chatId:
            session.chat_id,

          guardian:
            guardian
              ? {
                  name:
                    guardian.guardian_name,

                  contact:
                    guardian.contact,

                  fullName:
                    guardian.full_name,
                }
              : null,
        });
      } catch (error) {
        console.error(
          'Parent me failed:',
          error
        );

        res.status(500).json({
          error:
            'Database error',
        });
      }
    }
  );

  // ============================================
  // UPDATE PARENT INFORMATION
  // ============================================

  app.put(
    '/api/parent/me',
    async (req, res) => {
      try {
        const session =
          await requireParentSession(
            req
          );

        if (!session) {
          res.status(401).json({
            error:
              'Not logged in',
          });

          return;
        }

        const guardian =
          await upsertGuardianForParent(
            session.chat_id,
            {
              name: String(
                req.body?.name ?? ''
              ),

              contact: String(
                req.body?.contact ?? ''
              ),

              fullName: String(
                req.body?.fullName ??
                  ''
              ),
            }
          );

        res.json({
          chatId:
            session.chat_id,

          guardian: {
            name:
              guardian.guardian_name,

            contact:
              guardian.contact,

            fullName:
              guardian.full_name,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Could not update parent info';

        if (
          message.includes(
            'required'
          )
        ) {
          res.status(400).json({
            error: message,
          });

          return;
        }

        console.error(
          'Parent update failed:',
          error
        );

        res.status(500).json({
          error:
            'Could not update parent info',
        });
      }
    }
  );

  // ============================================
  // DELETE PARENT ACCOUNT
  // ============================================

  app.delete(
    '/api/parent/me',
    async (req, res) => {
      try {
        const session =
          await requireParentSession(
            req
          );

        if (!session) {
          res.status(401).json({
            error:
              'Not logged in',
          });

          return;
        }

        await deleteParentAccount(
          session.chat_id
        );

        clearSessionCookie(res);

        res.json({
          ok: true,
        });
      } catch (error) {
        console.error(
          'Parent delete failed:',
          error
        );

        res.status(500).json({
          error:
            'Could not delete parent account',
        });
      }
    }
  );

  // ============================================
  // LIST CHILDREN
  // ============================================

  app.get(
    '/api/parent/children',
    async (req, res) => {
      try {
        const session =
          await requireParentSession(
            req
          );

        if (!session) {
          res.status(401).json({
            error:
              'Not logged in',
          });

          return;
        }

        const children =
          await listChildrenInfo(
            session.chat_id
          );

        res.json({
          children,
        });
      } catch (error) {
        console.error(
          'Parent children list failed:',
          error
        );

        res.status(500).json({
          error:
            'Database error',
        });
      }
    }
  );

  // ============================================
  // ADD CHILD
  // ============================================

  app.post(
    '/api/parent/children',
    async (req, res) => {
      try {
        const session =
          await requireParentSession(
            req
          );

        if (!session) {
          res.status(401).json({
            error:
              'Not logged in',
          });

          return;
        }

        const child =
          await addChildForParent(
            session.chat_id,
            {
              nickname: String(
                req.body?.nickname ??
                  ''
              ),

              fullName:
                req.body?.fullName ==
                null
                  ? null
                  : String(
                      req.body.fullName
                    ),

              school: String(
                req.body?.school ?? ''
              ),

              className: String(
                req.body?.className ??
                  ''
              ),
            }
          );

        res.status(201).json({
          child,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Could not add child';

        if (
          message.includes(
            'required'
          )
        ) {
          res.status(400).json({
            error: message,
          });

          return;
        }

        console.error(
          'Parent add child failed:',
          error
        );

        res.status(500).json({
          error:
            'Could not add child',
        });
      }
    }
  );

  // ============================================
  // UPDATE CHILD
  // ============================================

  app.put(
    '/api/parent/children/:id',
    async (req, res) => {
      try {
        const session =
          await requireParentSession(
            req
          );

        if (!session) {
          res.status(401).json({
            error:
              'Not logged in',
          });

          return;
        }

        const childId =
          Number(
            req.params.id
          );

        if (
          !Number.isFinite(
            childId
          )
        ) {
          res.status(400).json({
            error:
              'Invalid child id',
          });

          return;
        }

        const child =
          await updateChildForParent(
            session.chat_id,
            childId,
            {
              nickname: String(
                req.body?.nickname ??
                  ''
              ),

              fullName:
                req.body?.fullName ==
                null
                  ? null
                  : String(
                      req.body.fullName
                    ),

              school: String(
                req.body?.school ?? ''
              ),

              className: String(
                req.body?.className ??
                  ''
              ),
            }
          );

        if (!child) {
          res.status(404).json({
            error:
              'Child not found',
          });

          return;
        }

        res.json({
          child,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Could not update child';

        if (
          message.includes(
            'required'
          )
        ) {
          res.status(400).json({
            error: message,
          });

          return;
        }

        console.error(
          'Parent update child failed:',
          error
        );

        res.status(500).json({
          error:
            'Could not update child',
        });
      }
    }
  );

  // ============================================
  // DELETE CHILD
  // ============================================

  app.delete(
    '/api/parent/children/:id',
    async (req, res) => {
      try {
        const session =
          await requireParentSession(
            req
          );

        if (!session) {
          res.status(401).json({
            error:
              'Not logged in',
          });

          return;
        }

        const childId =
          Number(
            req.params.id
          );

        if (
          !Number.isFinite(
            childId
          )
        ) {
          res.status(400).json({
            error:
              'Invalid child id',
          });

          return;
        }

        const deleted =
          await deleteChildForParent(
            session.chat_id,
            childId
          );

        if (!deleted) {
          res.status(404).json({
            error:
              'Child not found',
          });

          return;
        }

        res.json({
          ok: true,
        });
      } catch (error) {
        console.error(
          'Parent delete child failed:',
          error
        );

        res.status(500).json({
          error:
            'Could not delete child',
        });
      }
    }
  );

  // ============================================
  // CHILD-SPECIFIC WEB APP MANIFEST
  // ============================================

  app.get(
    '/api/manifest',
    async (req, res) => {
      res.set(
        'Cache-Control',
        'no-store, max-age=0'
      );

      const accessCode =
        parseAccessCode(
          req.query.access_code ??
            req.query.user_id
        );

      if (!accessCode) {
        res.status(400).json({
          error:
            'Invalid access_code',
        });

        return;
      }

      let nickname:
        string | null = null;

      try {
        const child =
          await findChildByAccessCode(
            accessCode
          );

        nickname =
          child?.nickname ?? null;
      } catch (error) {
        console.error(
          'Manifest child lookup failed:',
          error
        );
      }

      res
        .type(
          'application/manifest+json'
        )
        .send(
          JSON.stringify(
            buildManifest(
              accessCode,
              nickname
            ),
            null,
            2
          )
        );
    }
  );

  // ============================================
  // INSTALL PAGE
  // ============================================

  app.get(
    '/u/:accessCode',
    (req, res, next) => {
      const accessCode =
        parseAccessCode(
          req.params.accessCode
        );

      if (!accessCode) {
        next();
        return;
      }

      let html: string;

      try {
        html = fs.readFileSync(
          path.join(
            DIST_DIR,
            'index.html'
          ),
          'utf8'
        );
      } catch {
        next();
        return;
      }

      res.set(
        'Cache-Control',
        'no-store, max-age=0'
      );

      res
        .type('html')
        .send(
          injectManifestLink(
            html,
            accessCode
          )
        );
    }
  );

  // ============================================
  // SERVE FRONTEND
  // ============================================

  const sendSpa = (
    res: express.Response
  ): void => {
    res.set(
      'Cache-Control',
      'no-store, max-age=0'
    );

    res.sendFile(
      path.join(
        DIST_DIR,
        'index.html'
      ),
      (error) => {
        if (error) {
          res.status(500).send(
            'Frontend build missing. ' +
              'Run npm run build before starting the server.'
          );
        }
      }
    );
  };

  app.use(
    express.static(DIST_DIR)
  );

  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api')
    ) {
      next();
      return;
    }

    sendSpa(res);
  });

  // ============================================
  // START SERVER
  // ============================================

  app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `Tippy listening on http://0.0.0.0:${PORT}`
      );

      console.log(
        `Postgres: ${getDbHostLabel()}`
      );

      if (
        isMaintenanceEnabled()
      ) {
        console.log(
          'MAINTENANCE is ON — public site and PWAs show the rest screen'
        );
      }
    }
  );
}

main().catch((error) => {
  console.error(
    'Failed to start Tippy server:',
    error
  );

  process.exit(1);
});