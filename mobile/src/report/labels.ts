import type { AffectedGroup, Category, Severity } from '../../../contract/types';

/**
 * Categories a resident can pick: the home screen grid (01) and the chips on 02.
 *
 * fallen_tree is left out on purpose — the team picked three. It is still a
 * contract value, so existing fallen_tree reports render fine everywhere
 * else (labels come from src/labels.ts).
 */
export const CATEGORIES: Category[] = ['broken_sidewalk', 'blocked_ramp', 'broken_facility'];

export const SEVERITIES: Severity[] = ['low', 'medium', 'high'];

export const GROUPS: AffectedGroup[] = ['wheelchair', 'elderly', 'stroller', 'visually_impaired'];
