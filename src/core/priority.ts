/**
 * The priority formula. 0–100.
 *
 * Owner: BE-1. This is the only place where the number is made. The
 * mobile app and the admin panel get a finished score and a finished
 * breakdown. They never calculate it again. To change a weight, you
 * change this one file.
 *
 * Main test case, from contract/types.ts: 13 confirmations, high,
 * 4 days, 2 groups → 78. If this file stops giving 78, this file is
 * wrong.
 */

import {
  PRIORITY_CAPS,
  POINTS_PER_CONFIRMATION,
  POINTS_PER_DAY,
  POINTS_PER_GROUP,
  SEVERITY_POINTS,
} from '../../contract/types.ts';
import type {
  AffectedGroup,
  PriorityBreakdown,
  Severity,
} from '../../contract/types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The four things the score depends on. Nothing else. */
export interface PriorityInput {
  confirmation_count: number;
  severity: Severity;
  created_at: Date | string;
  affected_groups: AffectedGroup[];
  /** Set when the problem is closed. The clock stops on this date. */
  resolved_at?: Date | string | null;
}

export interface PriorityResult {
  /** A whole number, 0–100. Goes into reports.priority_score. */
  priority_score: number;
  /** The "why this matters" the user sees. These parts are not rounded. */
  priority_breakdown: PriorityBreakdown;
}

/**
 * A pure function: the same input always gives the same output. No
 * database, no network, and no clock of its own. We pass `now` in, so a
 * test can fix the date and the main test case still gives 78 tomorrow.
 */
export function calcPriority(
  input: PriorityInput,
  now: Date = new Date(),
): PriorityResult {
  const opened = toDate(input.created_at);
  // A closed problem stops getting older. We count days up to the date
  // it was resolved, not up to today.
  const until = input.resolved_at ? toDate(input.resolved_at) : now;
  const days_open = Math.max(0, (until.getTime() - opened.getTime()) / DAY_MS);

  // Every part has a limit. Without limits, one big part wins over all
  // the others: twenty people with a small problem would count for more
  // than three wheelchair users blocked for a month.
  const breakdown: PriorityBreakdown = {
    confirmations: Math.min(
      PRIORITY_CAPS.confirmations,
      Math.max(0, input.confirmation_count) * POINTS_PER_CONFIRMATION,
    ),
    severity: SEVERITY_POINTS[input.severity],
    duration: Math.min(PRIORITY_CAPS.duration, days_open * POINTS_PER_DAY),
    impact: Math.min(
      PRIORITY_CAPS.impact,
      countGroups(input.affected_groups) * POINTS_PER_GROUP,
    ),
  };

  // We round the TOTAL, never the parts. 20 + 22 + 4.5 + 5 = 51.5 → 52,
  // and the breakdown still shows duration as 4.5. If we rounded each
  // part first, we would get 51 here and wrong numbers elsewhere.
  const total =
    breakdown.confirmations +
    breakdown.severity +
    breakdown.duration +
    breakdown.impact;

  return { priority_score: Math.round(total), priority_breakdown: breakdown };
}

/** Count each group once. The same group twice must not give 10 points. */
function countGroups(groups: AffectedGroup[]): number {
  return new Set(groups).size;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}
