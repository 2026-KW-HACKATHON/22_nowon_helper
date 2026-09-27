/**
 * The one connection pool for the whole API.
 *
 * Owner: BE-1. Every handler borrows a client from here. A request that
 * needs a transaction takes one client with `pool.connect()` and gives
 * it back in `finally`; everything else calls `pool.query()`.
 */

import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

export const pool = new pg.Pool({ connectionString: url, max: 5 });

// A dropped idle connection must not crash the server. The pool opens a
// new one on the next query. Only the message: the error object can
// carry the connection details.
pool.on('error', (error) => {
  console.error(`db pool: ${error.message}`);
});

/** Anything we can run a query on: the pool itself or a client inside a transaction. */
export type Db = pg.Pool | pg.PoolClient;

/**
 * All of it, or none of it. Commits when `work` returns, rolls back when
 * it throws, and always gives the client back to the pool.
 */
export async function transaction<T>(work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/** Postgres error codes we turn into API errors. */
export const PG_UNIQUE_VIOLATION = '23505';

export function pgCode(error: unknown): string | undefined {
  return (error as { code?: string } | null)?.code;
}
