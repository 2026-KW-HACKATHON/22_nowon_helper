-- ─────────────────────────────────────────────────────────────
-- check.sql — is the database in the state the app expects?
--
-- Owner: BE-1 (db/**, src/core/**).
--
-- How to run: `npm run db:check`. Or paste the whole file into the
-- Supabase SQL Editor and press Run.
--
-- This file only reads. `npm run db:check` also runs it inside a
-- read-only transaction, so even a mistake here cannot change a row.
-- Safe to run on the shared database as often as you like, and once
-- more on the morning of the defense.
--
-- Two kinds of checks:
--
--   1. RULES. Always true, whatever people do in the app. If one
--      fails, the code that writes to the database has a bug.
--
--   2. DEMO. True right after db/seed.sql. They fail once people
--      start using the app: a new report, a 확인 +1 in rehearsal.
--      That is fine during development. Before the demo it means:
--      run the seed again.
--
-- All failures are collected and shown together, not only the first.
-- ─────────────────────────────────────────────────────────────

do $$
declare
  problems text[] := '{}';
  msg      text;
  n        integer;
  days     numeric;
begin

  -- ─── 1. RULES ──────────────────────────────────────────────

  -- The counter is a copy of the rows in `confirmations`. The two change
  -- in one transaction, so they can never differ.
  select string_agg(format('%s: counter %s, rows %s', id, confirmation_count, actual), '; ')
    into msg
  from (
    select rep.id, rep.confirmation_count, count(con.id) as actual
    from reports rep
    left join confirmations con on con.report_id = rep.id
    group by rep.id, rep.confirmation_count
    having rep.confirmation_count <> count(con.id)
  ) bad;
  if msg is not null then
    problems := problems || ('RULE confirmation_count differs from confirmations: ' || msg);
  end if;

  -- Creating a report counts as confirming it. Without this row the
  -- author could press 확인 +1 on their own report.
  select string_agg(rep.id::text, ', ') into msg
  from reports rep
  where not exists (
    select 1 from confirmations con
    where con.report_id = rep.id and con.device_id = rep.device_id
  );
  if msg is not null then
    problems := problems || ('RULE the author did not confirm their own report: ' || msg);
  end if;

  -- resolved_at is set exactly when the status is resolved.
  select string_agg(format('%s (%s)', id, status), ', ') into msg
  from reports
  where (status = 'resolved') <> (resolved_at is not null);
  if msg is not null then
    problems := problems || ('RULE status and resolved_at disagree: ' || msg);
  end if;

  -- The map loads before_thumb_url for every pin. One before photo per
  -- report, and it has a thumbnail.
  select string_agg(rep.id::text, ', ') into msg
  from reports rep
  where (
    select count(*) from report_photos ph
    where ph.report_id = rep.id and ph.kind = 'before' and ph.thumb_url is not null
  ) <> 1;
  if msg is not null then
    problems := problems || ('RULE not exactly one before photo with a thumbnail: ' || msg);
  end if;

  -- A resolved report closes the loop with an after photo.
  select string_agg(rep.id::text, ', ') into msg
  from reports rep
  where rep.status = 'resolved'
    and not exists (
      select 1 from report_photos ph
      where ph.report_id = rep.id and ph.kind = 'after'
    );
  if msg is not null then
    problems := problems || ('RULE resolved without an after photo: ' || msg);
  end if;

  -- The 진행 상황 block starts with null → new and ends with the
  -- current status.
  select string_agg(rep.id::text, ', ') into msg
  from reports rep
  where not exists (
    select 1 from status_logs sl
    where sl.report_id = rep.id and sl.from_status is null and sl.to_status = 'new'
  );
  if msg is not null then
    problems := problems || ('RULE status_logs has no first null → new entry: ' || msg);
  end if;

  select string_agg(format('%s (status %s, last log %s)', rep.id, rep.status, last.to_status), ', ')
    into msg
  from reports rep
  join lateral (
    select sl.to_status from status_logs sl
    where sl.report_id = rep.id
    order by sl.created_at desc
    limit 1
  ) last on true
  where last.to_status <> rep.status;
  if msg is not null then
    problems := problems || ('RULE the last status_logs entry is not the current status: ' || msg);
  end if;

  select string_agg(format('%s (%s)', id, priority_score), ', ') into msg
  from reports
  where priority_score not between 0 and 100;
  if msg is not null then
    problems := problems || ('RULE priority_score outside 0–100: ' || msg);
  end if;


  -- ─── 2. DEMO ───────────────────────────────────────────────

  -- The five reports from contract/fixtures.json, with the values the
  -- screens were drawn from. 1042 has 12 here, not 13: the demo phone
  -- makes it 13 on stage.
  select string_agg(fx.id::text, ', ') into msg
  from (values
    ('b3f1c2a4-1042-4a77-9c11-8d2e5f7a1042'::uuid, 'broken_sidewalk'::category, 'high'::severity,   'in_progress'::status, '월계동 광운로 20 앞',       78, 12),
    ('c8a2d5e1-1077-4b32-9e44-2a6f8c1b3d55'::uuid, 'blocked_ramp',              'medium',           'new',                 '월계로 3 횡단보도',         52,  8),
    ('e1b7f3c9-1039-4c18-8a72-5d3e9f2a7c11'::uuid, 'fallen_tree',               'medium',           'in_progress',         '초안산로 가로수',           39,  6),
    ('a4d9c6b2-1012-4e55-91f3-6b8a4c2d9e73'::uuid, 'blocked_ramp',              'low',              'new',                 '광운로 12 경사로',          24,  2),
    ('f6e3a1d8-0845-4d91-b2c7-9e1f5a3c8b40'::uuid, 'broken_facility',           'low',              'resolved',            '월계역 2번 출구 점자블록',  31,  3)
  ) as fx (id, category, severity, status, address, priority_score, confirmation_count)
  left join reports rep on rep.id = fx.id
  where rep.id is null
     or (rep.category, rep.severity, rep.status, rep.address, rep.priority_score, rep.confirmation_count)
        is distinct from
        (fx.category, fx.severity, fx.status, fx.address, fx.priority_score, fx.confirmation_count);
  if msg is not null then
    problems := problems || ('DEMO missing or changed fixture reports: ' || msg);
  end if;

  -- The chips on the map: 전체 8 · 신규 3 · 처리중 4 · 해결 1, inside
  -- the fixture bbox.
  select string_agg(format('%s %s', s, c), ', ' order by s) into msg
  from (
    select status::text as s, count(*) as c
    from reports
    where geom && st_makeenvelope(127.052, 37.615, 127.068, 37.626, 4326)::geography
    group by status
  ) counts;
  if msg is distinct from 'in_progress 4, new 3, resolved 1' then
    problems := problems || ('DEMO counts in the map bbox should be in_progress 4, new 3, resolved 1, got: ' || coalesce(msg, 'nothing'));
  end if;

  -- The demo phone must be able to press 확인 +1 on stage. It may only
  -- have confirmed the reports it created itself.
  select string_agg(con.report_id::text, ', ') into msg
  from confirmations con
  join reports rep on rep.id = con.report_id
  where con.device_id = '9f2c4e18-0b6a-4d3e-8f51-7c9a2b4d6e80'
    and rep.device_id <> con.device_id;
  if msg is not null then
    problems := problems || ('DEMO the demo phone already confirmed (확인 +1 will answer 409): ' || msg);
  end if;

  -- 1042 is worth 78 only while it is 3.34–4.66 days old:
  -- 75 + days * 0.75 must round to 78. The seed makes it 4 days old,
  -- so it stays 78 for about 16 hours after the seed.
  select extract(epoch from now() - created_at) / 86400 into days
  from reports where id = 'b3f1c2a4-1042-4a77-9c11-8d2e5f7a1042';
  if days is not null and days not between 3.34 and 4.66 then
    raise warning 'DEMO report 1042 is % days old. By the formula it is no longer 78. Run the seed again on the day of the demo.',
      round(days, 2);
  end if;


  -- ─── result ────────────────────────────────────────────────

  n := coalesce(array_length(problems, 1), 0);
  if n > 0 then
    raise exception E'% problem(s):\n  - %', n, array_to_string(problems, E'\n  - ');
  end if;

  raise notice 'All checks passed.';
end
$$;
