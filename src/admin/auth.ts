/**
 * Operator check for the two /api/admin/* endpoints.
 *
 * Owner: BE-2. The operator logs in with Supabase Auth (admin-web) and
 * sends the access token as `Authorization: Bearer <token>`. We ask
 * Supabase whose token it is, then find that email in `admins`. No
 * token, a bad token or an email that is not an operator → unauthorized.
 */

import type { NextFunction, Request, Response } from 'express';
import { pool } from '../core/db.ts';
import { ApiFailure } from '../core/errors.ts';

const TIMEOUT_MS = 3_000;

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = /^Bearer (.+)$/.exec(req.get('Authorization') ?? '')?.[1];
  const email = token ? await emailOf(token) : null;
  if (!email) throw new ApiFailure('unauthorized');

  const { rows } = await pool.query<{ id: string }>(
    'select id from admins where lower(email) = lower($1)',
    [email],
  );
  if (!rows[0]) throw new ApiFailure('unauthorized');

  res.locals.admin_id = rows[0].id;
  next();
}

/** The email behind a Supabase access token, or null. */
async function emailOf(token: string): Promise<string | null> {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { email?: string };
    return user.email ?? null;
  } catch {
    return null;
  }
}
