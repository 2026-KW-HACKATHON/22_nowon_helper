/**
 * The seed and the formula must agree. Run with `npm test`.
 *
 * db/seed.sql stores a finished priority_score for every report. The
 * API writes the same column through calcPriority(). If the two ever
 * disagree, the map shows one number and the detail screen another.
 *
 * This test reads seed.sql itself, not a copy of its numbers. So if
 * someone edits a score in the seed, or a weight in the formula, the
 * test names the report that no longer adds up.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { calcPriority } from './priority.ts';
import type { AffectedGroup, Severity } from '../../contract/types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The seed dates are `now() - interval`, so any fixed date works. */
const NOW = new Date('2026-09-17T04:12:00Z');

const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);

const seed = readFileSync(new URL('../../db/seed.sql', import.meta.url), 'utf8');

// One row of the `insert into reports` statement:
// ('id', 'device', 'category', 'severity', 'status',
//  st_makepoint(...)::geography, 'address',
//  score, count, now() - interval 'N days', null | now() - interval 'M days')
const REPORT_ROW = new RegExp(
  String.raw`\('(?<id>[0-9a-f-]{36})', '[0-9a-f-]{36}',\s+` +
    String.raw`'\w+', '(?<severity>\w+)', '\w+',\s+` +
    String.raw`st_makepoint\([^)]*\)::geography, '[^']*',\s+` +
    String.raw`(?<score>\d+), (?<count>\d+), now\(\) - interval '(?<days>\d+) days?', ` +
    String.raw`(?:null|now\(\) - interval '(?<resolved>\d+) days?')\)`,
  'g',
);

// One row of the `insert into affected_groups` statement: ('id', 'group')
const GROUP_ROW =
  /\('(?<id>[0-9a-f-]{36})', '(?<group>wheelchair|elderly|stroller|visually_impaired)'\)/g;

const groups = new Map<string, AffectedGroup[]>();
for (const { groups: g } of seed.matchAll(GROUP_ROW)) {
  const list = groups.get(g!.id!) ?? [];
  list.push(g!.group as AffectedGroup);
  groups.set(g!.id!, list);
}

const reports = [...seed.matchAll(REPORT_ROW)].map(({ groups: g }) => ({
  id: g!.id!,
  severity: g!.severity as Severity,
  stored_score: Number(g!.score),
  confirmation_count: Number(g!.count),
  days_open: Number(g!.days),
  resolved_days_ago: g!.resolved === undefined ? null : Number(g!.resolved),
}));

test('the test finds all 10 seed reports', () => {
  // Without this, a change in the seed layout would make the regex find
  // nothing, and every test below would pass by checking nothing.
  assert.equal(reports.length, 10);
});

for (const report of reports) {
  test(`seed report ${report.id.slice(9, 13)} has the score calcPriority() gives`, () => {
    const { priority_score } = calcPriority(
      {
        confirmation_count: report.confirmation_count,
        severity: report.severity,
        created_at: daysAgo(report.days_open),
        resolved_at:
          report.resolved_days_ago === null ? null : daysAgo(report.resolved_days_ago),
        affected_groups: groups.get(report.id) ?? [],
      },
      NOW,
    );

    assert.equal(report.stored_score, priority_score);
  });
}
