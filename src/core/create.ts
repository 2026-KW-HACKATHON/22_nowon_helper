/**
 * The create path: is there one already, a new report, 확인 +1.
 *
 * Owner: BE-1. The product in three handlers: a similar problem 50 m
 * away is not a new report, it is a 확인 +1 on the existing one.
 */

import type { Request, Response } from 'express';
import {
  DUPLICATE_MAX_AGE_DAYS,
  DUPLICATE_RADIUS_M,
  type ConfirmResponse,
  type CreateReportResponse,
  type NearbyResponse,
} from '../../contract/types.ts';
import { lookupAddress } from './address.ts';
import { PG_UNIQUE_VIOLATION, pgCode, pool, transaction } from './db.ts';
import { ApiFailure, isUuid } from './errors.ts';
import { calcPriority } from './priority.ts';
import { loadReport, reportColumns, toReport, type ReportRow } from './report.ts';
import * as check from './validate.ts';

/** Per device per day. The confirmations_device_idx index serves this count. */
const DAILY_CONFIRM_LIMIT = 20;

// ─── 1. POST /api/reports/nearby ──────────────────────────────

const NEARBY_SQL = `
select ${reportColumns('single', '$1')},
       st_distance(r.geom, st_makepoint($3, $2)::geography) as distance_m
  from reports r
 where r.category = $4
   and r.status <> 'resolved'
   and r.created_at > now() - make_interval(days => $6)
   and st_dwithin(r.geom, st_makepoint($3, $2)::geography, $5)
 order by distance_m
 limit 1`;

export async function nearby(req: Request, res: Response<NearbyResponse>) {
  const input = check.body(req.body);
  const { lat, lng } = check.latLng(input.lat, input.lng);
  const category = check.oneOf(check.CATEGORIES, input.category);

  const { rows } = await pool.query<ReportRow>(NEARBY_SQL, [
    res.locals.device_id, lat, lng, category, DUPLICATE_RADIUS_M, DUPLICATE_MAX_AGE_DAYS,
  ]);
  const row = rows[0];
  res.json({ duplicate: row ? toReport(row, 'single') : null, radius_m: DUPLICATE_RADIUS_M });
}

// ─── 2. POST /api/reports ─────────────────────────────────────
// One statement writes everything: a statement is atomic by itself, so
// either all six inserts land or none do. Creating a report also counts
// as confirming it, so it starts at confirmation_count 1.

const CREATE_SQL = `
with device as (
  insert into devices (id) values ($1) on conflict do nothing
), report as (
  insert into reports (device_id, category, severity, geom, address, description,
                       confirmation_count, priority_score)
  values ($1, $2, $3, st_makepoint($5, $4)::geography, $6, $7, 1, $8)
  returning id
), report_groups as (
  insert into affected_groups (report_id, group_code)
  select report.id, g from report, unnest($9::affected_group[]) as g
), photo as (
  insert into report_photos (report_id, kind, url, thumb_url)
  select id, 'before', $10, $11 from report
), log as (
  insert into status_logs (report_id, from_status, to_status)
  select id, null, 'new' from report
), confirmation as (
  insert into confirmations (report_id, device_id)
  select id, $1 from report
)
select id from report`;

export async function create(req: Request, res: Response<CreateReportResponse>) {
  const input = check.body(req.body);
  const { lat, lng } = check.latLng(input.lat, input.lng);
  const category = check.oneOf(check.CATEGORIES, input.category);
  const severity = check.oneOf(check.SEVERITIES, input.severity);
  const affected_groups = check.groups(input.affected_groups);
  const photo_url = check.url(input.photo_url);
  const photo_thumb_url = check.url(input.photo_thumb_url);
  const description = check.text(input.description, { max: 1000, required: false });

  const address = await lookupAddress(lat, lng);
  const { priority_score } = calcPriority({
    confirmation_count: 1, severity, created_at: new Date(), affected_groups,
  });

  const device_id: string = res.locals.device_id;
  const { rows } = await pool.query<{ id: string }>(CREATE_SQL, [
    device_id, category, severity, lat, lng, address, description, priority_score,
    affected_groups, photo_url, photo_thumb_url,
  ]);

  const row = await loadReport(pool, rows[0]!.id, device_id, 'single');
  res.status(201).json(toReport(row!, 'single'));
}

// ─── 3. POST /api/reports/:id/confirm ─────────────────────────
// One transaction: insert into confirmations + increment the counter +
// recompute the score. The row lock makes two taps at the same moment
// wait for each other, so neither computes the score from a stale count.

export async function confirm(req: Request<{ id: string }>, res: Response<ConfirmResponse>) {
  const id = req.params.id;
  if (!isUuid(id)) throw new ApiFailure('report_not_found');
  const device_id: string = res.locals.device_id;

  const result = await transaction(async (db) => {
    const locked = await db.query('select 1 from reports where id = $1 for update', [id]);
    if (locked.rowCount === 0) throw new ApiFailure('report_not_found');

    const { rows: [today] } = await db.query<{ count: number }>(
      `with device as (insert into devices (id) values ($1) on conflict do nothing)
       select count(*)::int as count from confirmations
        where device_id = $1 and created_at > now() - interval '1 day'`,
      [device_id],
    );
    if (today!.count >= DAILY_CONFIRM_LIMIT) throw new ApiFailure('rate_limited');

    try {
      await db.query('insert into confirmations (report_id, device_id) values ($1, $2)', [id, device_id]);
    } catch (error) {
      // UNIQUE (report_id, device_id): the database says "twice".
      if (pgCode(error) === PG_UNIQUE_VIOLATION) throw new ApiFailure('already_confirmed');
      throw error;
    }

    const now = new Date();
    const before = (await loadReport(db, id, device_id, 'single'))!;
    const after: ReportRow = { ...before, confirmation_count: before.confirmation_count + 1 };
    await db.query(
      'update reports set confirmation_count = $2, priority_score = $3 where id = $1',
      [id, after.confirmation_count, calcPriority(after, now).priority_score],
    );

    return {
      report: toReport(after, 'single', now),
      previous_confirmation_count: before.confirmation_count,
      previous_priority_score: calcPriority(before, now).priority_score,
    };
  });

  res.json(result);
}
