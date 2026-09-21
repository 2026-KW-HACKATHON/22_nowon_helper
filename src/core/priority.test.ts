/**
 * Tests for the priority formula. Run them with `npm test`.
 *
 * The numbers here are not invented. They come from contract/types.ts
 * and contract/fixtures.json. So if the contract changes, these tests
 * fail instead of quietly agreeing with old numbers.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calcPriority } from './priority.ts';
import { PRIORITY_REFERENCE_CASE } from '../../contract/types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A fixed date. Without it, every test would change its result daily. */
const NOW = new Date('2026-09-17T04:12:00Z');

const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);

test('the main case from the contract gives 78', () => {
  const { input, expected_score, expected_breakdown } = PRIORITY_REFERENCE_CASE;

  const result = calcPriority(
    {
      confirmation_count: input.confirmations,
      severity: input.severity,
      created_at: daysAgo(input.days_open),
      affected_groups: ['wheelchair', 'elderly'], // input.groups = 2
    },
    NOW,
  );

  assert.equal(result.priority_score, expected_score);
  assert.deepEqual(result.priority_breakdown, expected_breakdown);
});

test('we round the total, not the parts: report 1077 gives 52', () => {
  // 8 confirmations (20) + medium (22) + 6 days (4.5) + 1 group (5) = 51.5
  const result = calcPriority(
    {
      confirmation_count: 8,
      severity: 'medium',
      created_at: daysAgo(6),
      affected_groups: ['wheelchair'],
    },
    NOW,
  );

  assert.equal(result.priority_score, 52);
  assert.equal(result.priority_breakdown.duration, 4.5);
});

test('a new report gives 30, like the create fixture says', () => {
  // 1 confirmation (2.5) + medium (22) + 0 days (0) + 1 group (5) = 29.5
  const result = calcPriority(
    {
      confirmation_count: 1,
      severity: 'medium',
      created_at: NOW,
      affected_groups: ['elderly'],
    },
    NOW,
  );

  assert.equal(result.priority_score, 30);
});

test('confirmations stop counting at the limit', () => {
  const base = {
    severity: 'high' as const,
    created_at: daysAgo(4),
    affected_groups: ['wheelchair' as const, 'elderly' as const],
  };

  // 12 * 2.5 is exactly 30, the limit. Report 1042 is already there, so
  // the next 확인 +1 changes the counter but not the score.
  const twelve = calcPriority({ ...base, confirmation_count: 12 }, NOW);
  const thirteen = calcPriority({ ...base, confirmation_count: 13 }, NOW);
  const hundred = calcPriority({ ...base, confirmation_count: 100 }, NOW);

  assert.equal(twelve.priority_score, 78);
  assert.equal(thirteen.priority_score, 78);
  assert.equal(hundred.priority_breakdown.confirmations, 30);
});

test('days stop counting at 15 points, however old the problem is', () => {
  const result = calcPriority(
    {
      confirmation_count: 0,
      severity: 'low',
      created_at: daysAgo(400),
      affected_groups: [],
    },
    NOW,
  );

  assert.equal(result.priority_breakdown.duration, 15);
});

test('a closed problem stops getting older on resolved_at', () => {
  const closed = calcPriority(
    {
      confirmation_count: 3,
      severity: 'low',
      created_at: daysAgo(13),
      resolved_at: daysAgo(5), // open for 8 days → 6 points
      affected_groups: ['visually_impaired'],
    },
    NOW,
  );

  const stillOpen = calcPriority(
    {
      confirmation_count: 3,
      severity: 'low',
      created_at: daysAgo(13), // 13 days → 9.75 points
      affected_groups: ['visually_impaired'],
    },
    NOW,
  );

  assert.equal(closed.priority_breakdown.duration, 6);
  assert.equal(stillOpen.priority_breakdown.duration, 9.75);
});

test('the same group twice does not give extra points', () => {
  const result = calcPriority(
    {
      confirmation_count: 0,
      severity: 'low',
      created_at: NOW,
      affected_groups: ['elderly', 'elderly', 'elderly'],
    },
    NOW,
  );

  assert.equal(result.priority_breakdown.impact, 5);
});
