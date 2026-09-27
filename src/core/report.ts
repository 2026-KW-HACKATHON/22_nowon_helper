/**
 * One SELECT that builds a whole Report, and the row → Report mapping.
 *
 * Owner: BE-1. Every endpoint that returns a Report goes through here,
 * so the shape is the same everywhere and each screen stays one query:
 * photos, groups, confirmed_by_me and the status log are subqueries of
 * the same statement, not extra round trips.
 *
 * The score is recomputed on every read (contract/README.md): the
 * duration part grows by itself, so the stored priority_score goes stale.
 */

import type {
  AffectedGroup,
  Category,
  Report,
  Severity,
  Status,
  StatusLogEntry,
} from '../../contract/types.ts';
import type { Db } from './db.ts';
import { calcPriority } from './priority.ts';

/**
 * How much of the Report a response carries.
 *   list   — map pins: rounded coordinates, thumbnail only, no breakdown.
 *   single — one report after an action (nearby, create, confirm): exact
 *            coordinates, all photos, the breakdown.
 *   detail — single + the status log. The detail screen and the admin.
 */
export type ReportView = 'list' | 'single' | 'detail';

/** Timestamps leave the database already as ISO 8601 UTC, like the fixtures. */
const iso = (column: string) =>
  `to_char(${column} at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

/**
 * The column list for `select ... from reports r`. The caller adds the
 * `where` and `order by`. `device_param` is the SQL placeholder holding
 * the caller's X-Device-Id, e.g. '$1'.
 *
 * group_code is cast to text: node-pg does not know our enum array type
 * and would hand back the raw '{wheelchair,elderly}' string.
 */
export function reportColumns(view: ReportView, device_param: string): string {
  const columns = [
    'r.id',
    'r.category',
    'r.severity',
    'r.status',
    'st_y(r.geom::geometry) as lat',
    'st_x(r.geom::geometry) as lng',
    'r.address',
    'r.confirmation_count',
    `${iso('r.created_at')} as created_at`,
    `${iso('r.resolved_at')} as resolved_at`,
    `coalesce((select array_agg(g.group_code::text order by g.group_code)
                 from affected_groups g where g.report_id = r.id), '{}') as affected_groups`,
    `(select p.thumb_url from report_photos p
       where p.report_id = r.id and p.kind = 'before'
       order by p.created_at limit 1) as before_thumb_url`,
    `exists(select 1 from confirmations c
             where c.report_id = r.id and c.device_id = ${device_param}::uuid) as confirmed_by_me`,
  ];

  if (view !== 'list') {
    columns.push(
      `(select p.url from report_photos p
         where p.report_id = r.id and p.kind = 'before'
         order by p.created_at limit 1) as before_url`,
      `(select p.url from report_photos p
         where p.report_id = r.id and p.kind = 'after'
         order by p.created_at desc limit 1) as after_url`,
    );
  }

  if (view === 'detail') {
    columns.push(
      `(select coalesce(json_agg(json_build_object(
                 'from_status', s.from_status,
                 'to_status',   s.to_status,
                 'note',        s.note,
                 'created_at',  ${iso('s.created_at')}
               ) order by s.created_at), '[]')
          from status_logs s where s.report_id = r.id) as status_log`,
    );
  }

  return columns.join(',\n       ');
}

/** What one row of reportColumns() looks like after node-pg parses it. */
export interface ReportRow {
  id: string;
  category: Category;
  severity: Severity;
  status: Status;
  lat: number;
  lng: number;
  address: string;
  confirmation_count: number;
  created_at: string;
  resolved_at: string | null;
  affected_groups: AffectedGroup[];
  before_thumb_url: string | null;
  confirmed_by_me: boolean;
  before_url?: string | null;
  after_url?: string | null;
  status_log?: StatusLogEntry[];
  distance_m?: number;
}

/**
 * Row → Report. Runs calcPriority() on the row, so the score is always
 * today's.
 */
export function toReport(row: ReportRow, view: ReportView, now = new Date()): Report {
  const { priority_score, priority_breakdown } = calcPriority(row, now);
  const list = view === 'list';

  const report: Report = {
    id: row.id,
    category: row.category,
    severity: row.severity,
    status: row.status,
    lat: list ? round4(row.lat) : row.lat,
    lng: list ? round4(row.lng) : row.lng,
    address: row.address,
    priority_score,
    confirmation_count: row.confirmation_count,
    affected_groups: row.affected_groups,
    photos: {
      before_thumb_url: row.before_thumb_url,
      before_url: row.before_url ?? null,
      after_url: row.after_url ?? null,
    },
    created_at: row.created_at,
    resolved_at: row.resolved_at,
    confirmed_by_me: row.confirmed_by_me,
  };

  if (!list) report.priority_breakdown = priority_breakdown;
  if (view === 'detail') report.status_log = row.status_log ?? [];
  if (row.distance_m !== undefined) report.distance_m = Math.round(row.distance_m);
  return report;
}

/**
 * One report by id, as the given view, or null. Pass a transaction
 * client to see the rows the same transaction has just written.
 */
export async function loadReport(
  db: Db,
  id: string,
  device_id: string,
  view: ReportView,
): Promise<ReportRow | null> {
  const { rows } = await db.query<ReportRow>(
    `select ${reportColumns(view, '$1')} from reports r where r.id = $2`,
    [device_id, id],
  );
  return rows[0] ?? null;
}

/**
 * Stores the score calcPriority() gives for this row. Every write ends
 * with it, so the admin list, sorted by the stored column, stays fresh.
 */
export async function storeScore(db: Db, row: ReportRow, now = new Date()): Promise<void> {
  const { priority_score } = calcPriority(row, now);
  await db.query('update reports set priority_score = $2 where id = $1', [row.id, priority_score]);
}

/** ~11 m. The public map never shows the exact point. */
function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
