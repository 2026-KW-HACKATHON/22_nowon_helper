/**
 * Runs db/seed.sql against the database in DATABASE_URL.
 * Use it through `npm run db:seed`.
 *
 * Owner: BE-1. WRITES TO THE SHARED DATABASE: seed.sql deletes every
 * report, device and confirmation first, then loads the 10 demo reports.
 * Ask the team before you run it. Run it on the morning of the demo so
 * report 1042 is exactly 4 days old and worth 78.
 *
 * One transaction: if any line fails, nothing changes.
 */

import { readFile } from 'node:fs/promises';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const sql = await readFile(new URL('./seed.sql', import.meta.url), 'utf8');
const client = new pg.Client({ connectionString: url });

try {
  await client.connect();
  await client.query('begin');
  await client.query(sql);
  await client.query('commit');
  console.log('Seed loaded: 10 demo reports.');
} catch (error) {
  await client.query('rollback').catch(() => {});
  // Only the message: the error object can carry the connection details.
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.end();
}
