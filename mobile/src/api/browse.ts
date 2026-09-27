/**
 * Browse path (FE-2): the map and the detail screen.
 *
 * EXPO_PUBLIC_API_URL set → one request() to the real endpoint, with the
 * X-Device-Id header. Unset → the answer comes from contract/fixtures.json
 * (see config.ts), so the screens run without a server.
 *
 * One function = one endpoint from contract/README.md. One screen calls
 * one function.
 */

import fixtures from '../../../contract/fixtures.json';
import type { MapResponse, Report, ReportDetailResponse } from '../../../contract/types';
import { ApiRequestError, request } from './client';
import { USE_FIXTURES } from './config';

/** minLng, minLat, maxLng, maxLat — the order of the ?bbox= parameter. */
export type Bbox = [number, number, number, number];

/** The area the fixtures describe: 월계동 around Kwangwoon University. */
export const DEMO_BBOX: Bbox = [127.052, 37.615, 127.068, 37.626];

const mapFixture = fixtures['GET /api/reports?bbox=127.052,37.615,127.068,37.626']
  .response as MapResponse;
const detailFixture = fixtures['GET /api/reports/:id'].response as ReportDetailResponse;

/** GET /api/reports?bbox= — points and status counts for the map. */
export async function getMap(bbox: Bbox): Promise<MapResponse> {
  if (USE_FIXTURES) return mapFixture;
  return request<MapResponse>('GET', `/api/reports?bbox=${bbox.join(',')}`, undefined);
}

/**
 * GET /api/reports/:id — details.
 *
 * The fixtures have a full detail response for one report only (1042).
 * For the others we return what the map fixture knows. It has no
 * priority_breakdown, no status_log and no full photo, so the detail
 * screen hides those blocks instead of inventing them.
 */
export async function getReport(id: string): Promise<ReportDetailResponse> {
  if (!USE_FIXTURES) {
    return request<ReportDetailResponse>('GET', `/api/reports/${encodeURIComponent(id)}`, undefined);
  }

  if (id === detailFixture.id) return detailFixture;

  const fromMap = mapFixture.reports.find((report: Report) => report.id === id);
  if (fromMap) return fromMap;

  throw new ApiRequestError('report_not_found', '문제를 찾을 수 없습니다.');
}
