/**
 * GET /api/reports?bbox=minLng,minLat,maxLng,maxLat — points for the map.
 *
 * Owner: BE-2. One query. The status counts are counted from the same
 * rows in JS: the list holds every report in the box, so a second
 * `count(*)` query would only repeat it.
 */

import type { Request, Response } from 'express';
import type { MapResponse, Status } from '../../contract/types.ts';
import { pool } from '../core/db.ts';
import { ApiFailure } from '../core/errors.ts';
import { reportColumns, toReport, type ReportRow } from '../core/report.ts';

const SQL = `
select ${reportColumns('list', '$1')}
  from reports r
 where r.geom && st_makeenvelope($2, $3, $4, $5, 4326)::geography`;

export async function getMap(req: Request, res: Response<MapResponse>) {
  const bbox = parseBbox(req.query.bbox);
  const { rows } = await pool.query<ReportRow>(SQL, [res.locals.device_id, ...bbox]);

  // Sorted by today's score, not the stored one: that one may be stale.
  const reports = rows
    .map((row) => toReport(row, 'list'))
    .sort((a, b) => b.priority_score - a.priority_score);

  const counts: Record<Status, number> = { new: 0, in_progress: 0, resolved: 0 };
  for (const report of reports) counts[report.status] += 1;

  res.json({ reports, counts });
}

function parseBbox(value: unknown): [number, number, number, number] {
  if (typeof value !== 'string') throw new ApiFailure('invalid_payload');
  const parts = value.split(',').map(Number);
  if (parts.length !== 4 || !parts.every(Number.isFinite)) {
    throw new ApiFailure('invalid_payload');
  }
  const [minLng, minLat, maxLng, maxLat] = parts as [number, number, number, number];
  if (minLng >= maxLng || minLat >= maxLat) throw new ApiFailure('invalid_payload');
  return [minLng, minLat, maxLng, maxLat];
}
