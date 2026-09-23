import type { AffectedGroup, Category, Severity, Status } from '../../contract/types';

/**
 * Categories a resident can pick on screen 02. fallen_tree stays in the
 * contract (existing reports still show it), it is only hidden from the picker.
 */
export const CATEGORIES: Category[] = [
  'broken_sidewalk',
  'blocked_ramp',
  'broken_facility',
];

export const CATEGORY_LABEL: Record<Category, string> = {
  fallen_tree: '쓰러진 나무',
  broken_sidewalk: '파손된 보도',
  blocked_ramp: '막힌 경사로',
  broken_facility: '고장난 시설',
};

export const SEVERITIES: Severity[] = ['low', 'medium', 'high'];

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

export const GROUPS: AffectedGroup[] = ['wheelchair', 'elderly', 'stroller', 'visually_impaired'];

export const GROUP_LABEL: Record<AffectedGroup, string> = {
  wheelchair: '휠체어 이용자',
  elderly: '고령자',
  stroller: '유아차',
  visually_impaired: '시각장애',
};

export const STATUS_LABEL: Record<Status, string> = {
  new: '신규',
  in_progress: '처리중',
  resolved: '해결',
};
