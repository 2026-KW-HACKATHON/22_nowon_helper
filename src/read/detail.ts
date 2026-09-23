/**
 * GET /api/reports/:id — details, with the breakdown and the status log.
 *
 * Owner: BE-2. One query. The only endpoint that sends the full
 * before_url image.
 */

import type { Request, Response } from 'express';
import type { ReportDetailResponse } from '../../contract/types.ts';
import { pool } from '../core/db.ts';
import { ApiFailure, isUuid } from '../core/errors.ts';
import { reportColumns, toReport, type ReportRow } from '../core/report.ts';

const SQL = `
select ${reportColumns('detail', '$1')}
  from reports r
 where r.id = $2`;

export async function getReport(req: Request<{ id: string }>, res: Response<ReportDetailResponse>) {
  // Not a uuid cannot be a report. Postgres would answer with a type
  // error, and the app would show 500 instead of "not found".
  if (!isUuid(req.params.id)) throw new ApiFailure('report_not_found');

  const { rows } = await pool.query<ReportRow>(SQL, [res.locals.device_id, req.params.id]);
  const row = rows[0];
  if (!row) throw new ApiFailure('report_not_found');

  res.json(toReport(row, 'detail'));
}
