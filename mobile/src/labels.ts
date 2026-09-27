/**
 * Korean labels and colors for the contract enums. The data carries the
 * codes (`broken_sidewalk`); the screens show these words. One place, so
 * the same problem is never called two different names.
 *
 * The words come from the comments in contract/types.ts.
 */

import type { AffectedGroup, Category, Severity, Status } from '../../contract/types';

export const CATEGORY_LABEL: Record<Category, string> = {
  fallen_tree: '쓰러진 나무',
  broken_sidewalk: '파손된 보도',
  blocked_ramp: '막힌 경사로',
  broken_facility: '고장난 시설',
};

export const STATUS_LABEL: Record<Status, string> = {
  new: '신규',
  in_progress: '처리중',
  resolved: '해결',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

export const GROUP_LABEL: Record<AffectedGroup, string> = {
  wheelchair: '휠체어 이용자',
  elderly: '고령자',
  stroller: '유아차',
  visually_impaired: '시각장애',
};

export const STATUS_COLOR: Record<Status, string> = {
  new: '#5C6663',
  in_progress: '#B87503',
  resolved: '#0E8A5F',
};

/** Pin and bar color. The thresholds are a design choice, not contract. */
export function priorityColor(score: number): string {
  if (score >= 60) return '#C0392B';
  if (score >= 35) return '#B87503';
  return '#0E8A5F';
}
