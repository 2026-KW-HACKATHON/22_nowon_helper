/**
 * Runs db/check.sql against the database in DATABASE_URL.
 * Use it through `npm run db:check`.
 *
 * Owner: BE-1. The checks themselves live in check.sql, so they can
 * also be pasted into the Supabase SQL Editor. This file only connects,
 * runs them and prints the result.
 *
 * Everything runs inside a READ ONLY transaction that is rolled back at
 * the end. Even a mistake in check.sql cannot change a row, so anyone
 * on the team can run this against the shared database.
 */

import { readFile } from 'node:fs/promises';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const sql = await readFile(new URL('./check.sql', import.meta.url), 'utf8');

const client = new pg.Client({ connectionString: url });
// `raise notice` and `raise warning` from check.sql arrive here.
client.on('notice', (notice) => {
  console.log(`${notice.severity ?? 'NOTICE'}: ${notice.message}`);
});

try {
  await client.connect();
  await client.query('begin read only');
  await client.query(sql);
} catch (error) {
  // Only the message: the error object can carry the connection details.
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.query('rollback').catch(() => {});
  await client.end();
}
