import type { AffectedGroup, Category, Severity } from '../../../contract/types';

/**
 * Categories a resident can pick on screen 02.
 *
 * OPEN QUESTION FOR THE TEAM: fallen_tree is missing here — CLAUDE.md and
 * the contract say all four categories are shown. Decide out loud before
 * shipping; until then this stays 3 and existing fallen_tree reports still
 * render fine everywhere else (labels come from src/labels.ts).
 */
export const CATEGORIES: Category[] = ['broken_sidewalk', 'blocked_ramp', 'broken_facility'];

export const SEVERITIES: Severity[] = ['low', 'medium', 'high'];

export const GROUPS: AffectedGroup[] = ['wheelchair', 'elderly', 'stroller', 'visually_impaired'];
