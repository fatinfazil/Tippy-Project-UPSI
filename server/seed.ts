import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { getPool, initDb, seedChildrenIfEmpty, type ChildRow } from './db.ts';

/**
 * Demo roster. user_id is the stable internal key; access_code is what parents
 * put in /u/{access_code} links (migrated from the old URL user_id values).
 */
export const SEED_CHILDREN: ChildRow[] = [
  {
    user_id: 'usr_aina',
    access_code: 'AB7K2',
    nickname: 'Aina',
    full_name: 'Aina binti Ahmad',
    school: 'SK Taman Molek',
  },
  {
    user_id: 'usr_adam',
    access_code: 'DEMO1',
    nickname: 'Adam',
    full_name: 'Adam bin Hassan',
    school: 'SK Taman Molek',
  },
  {
    user_id: 'usr_mia',
    access_code: 'DEMO2',
    nickname: 'Mia',
    full_name: 'Mia Tan',
    school: 'SJK(C) Foon Yew',
  },
];

export async function runSeed(): Promise<number> {
  await initDb();
  return seedChildrenIfEmpty(SEED_CHILDREN);
}

const thisFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (invokedFile === thisFile) {
  void (async () => {
    try {
      const inserted = await runSeed();
      if (inserted === 0) {
        console.log('Seed skipped: children table already has rows.');
      } else {
        console.log(`Seeded ${inserted} children into Postgres`);
      }
      await getPool().end();
    } catch (error) {
      console.error('Seed failed:', error);
      process.exit(1);
    }
  })();
}
