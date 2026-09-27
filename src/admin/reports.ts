/**
 * The operator moves a report along: new → in_progress → resolved.
 *
 * Owner: BE-2. Both endpoints are one transaction each and answer the
 * full Report with the new status_log entry.
 *
 * `resolved` is reachable only through /resolve: closing the loop needs
 * the after photo, that is the whole point of the product.
 */

import type { Request, Response } from 'express';
import type { Report, Status } from '../../contract/types.ts';
import { transaction, type Db } from '../core/db.ts';
import { ApiFailure, isUuid } from '../core/errors.ts';
import { loadReport, storeScore, toReport } from '../core/report.ts';
import * as check from '../core/validate.ts';

// ─── 8. PATCH /api/admin/reports/:id/status ───────────────────

export async function updateStatus(req: Request<{ id: string }>, res: Response<Report>) {
  const input = check.body(req.body);
  const status = check.oneOf(check.STATUSES, input.status);
  const note = check.text(input.note, { max: 200, required: false });
  if (status === 'resolved') throw new ApiFailure('invalid_payload');

  const report = await transaction(async (db) => {
    const from = await lockStatus(db, req.params.id);
    if (from === status) throw new ApiFailure('invalid_payload');

    // Reopening a resolved report starts its clock again.
    await db.query(
      `update reports set status = $2, resolved_at = null where id = $1`,
      [req.params.id, status],
    );
    await log(db, req.params.id, from, status, res.locals.admin_id, note);
    return reload(db, req.params.id, res.locals.device_id);
  });

  res.json(report);
}

// ─── 9. PATCH /api/admin/reports/:id/resolve ──────────────────

export async function resolve(req: Request<{ id: string }>, res: Response<Report>) {
  const input = check.body(req.body);
  const after_photo_url = check.url(input.after_photo_url);
  const note = check.text(input.note, { max: 200, required: false });

  const report = await transaction(async (db) => {
    const from = await lockStatus(db, req.params.id);
    if (from === 'resolved') throw new ApiFailure('invalid_payload');

    await db.query(
      `insert into report_photos (report_id, kind, url) values ($1, 'after', $2)`,
      [req.params.id, after_photo_url],
    );
    // The clock stops here: calcPriority() counts days up to resolved_at.
    await db.query(
      `update reports set status = 'resolved', resolved_at = now() where id = $1`,
      [req.params.id],
    );
    await log(db, req.params.id, from, 'resolved', res.locals.admin_id, note);
    return reload(db, req.params.id, res.locals.device_id);
  });

  res.json(report);
}

// ─── shared steps ─────────────────────────────────────────────

/** Locks the row for the transaction and returns its current status. */
async function lockStatus(db: Db, id: string): Promise<Status> {
  if (!isUuid(id)) throw new ApiFailure('report_not_found');
  const { rows } = await db.query<{ status: Status }>(
    'select status from reports where id = $1 for update',
    [id],
  );
  if (!rows[0]) throw new ApiFailure('report_not_found');
  return rows[0].status;
}

async function log(db: Db, id: string, from: Status, to: Status, admin_id: string, note: string | null) {
  await db.query(
    `insert into status_logs (report_id, from_status, to_status, admin_id, note)
     values ($1, $2, $3, $4, $5)`,
    [id, from, to, admin_id, note],
  );
}

/** The report as the operator now sees it, with the fresh score stored. */
async function reload(db: Db, id: string, device_id: string | undefined): Promise<Report> {
  // The operator is not a resident; a zero uuid confirms nothing.
  const row = (await loadReport(db, id, device_id ?? '00000000-0000-0000-0000-000000000000', 'detail'))!;
  await storeScore(db, row);
  return toReport(row, 'detail');
}
