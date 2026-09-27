-- ─────────────────────────────────────────────────────────────
-- seed.sql — 10 demo reports around 월계동.
--
-- Owner: BE-1 (db/**, src/core/**).
--
-- The data comes from contract/fixtures.json. The five reports that
-- exist there keep their exact id, coordinates, address, counter and
-- score. So the screens look the same whether the app talks to the mock
-- server or to the real API.
--
-- Run it after 0001_init.sql. You can run it many times: it deletes
-- everything first.
--
--
-- WHY THE DATES ARE RELATIVE
--
-- One part of the priority grows every day: min(15, days_open * 0.75).
-- If we copied the date from the fixtures ('2026-09-13'), the main
-- report would be 8 days old today and 15 days old at the defense. Its
-- score would move 78 → 81 → 90, while the mockups, the slides and the
-- contract all say 78.
--
-- With `now() - interval` the score is always 78. Even if we reload the
-- database five minutes before the demo.
--
--
-- THE DEMO 확인 +1 DOES NOT MOVE THE SCORE
--
-- Report 1042 is already at the confirmations cap: 12 * 2.5 = 30.
-- 확인 +1 moves the counter 12 → 13, and the score stays 78. The
-- confirm fixture says the same (previous_priority_score 78). On stage
-- we show the counter. To show the score going up, use report 1077:
-- 8 → 9 confirmations gives 52 → 54.
--
-- Every score in this file is what calcPriority() gives. `npm test`
-- checks that (src/core/seed-scores.test.ts).
-- ─────────────────────────────────────────────────────────────


-- ─── delete everything first ─────────────────────────────────
-- `cascade` also clears confirmations, affected_groups, report_photos
-- and status_logs, because they all point at reports.

truncate table reports, devices, admins cascade;


-- ─── the operator ────────────────────────────────────────────
-- This is only the profile. The account that logs in is created by BE-2
-- in Supabase Auth. status_logs points at this row.

insert into admins (id, email, department, role) values
  ('7e4c1a90-0001-4d62-9f83-0a1b2c3d4e5f', 'operator@nowon.go.kr', '노원구 도로과', 'operator');


-- ─── devices ─────────────────────────────────────────────────
-- Three kinds:
--   1. The demo phone. This id is the one contract/fixtures.json sends
--      in X-Device-Id. It creates two reports, so that screen 06
--      ("내 신고") is not empty. It confirms nothing else — see below.
--   2. One author for the reports the demo phone did not create.
--   3. Sixty anonymous devices that do the confirming.

insert into devices (id, created_at) values
  ('9f2c4e18-0b6a-4d3e-8f51-7c9a2b4d6e80', now() - interval '20 days'),
  ('00000000-0000-4000-8000-000000000001', now() - interval '20 days');

insert into devices (id, created_at)
select gen_random_uuid(), now() - interval '20 days'
from generate_series(1, 60);


-- ─── reports ─────────────────────────────────────────────────
-- Careful: st_makepoint takes LONGITUDE FIRST, then latitude. If you
-- swap them, 월계동 lands in the sea and every distance is wrong.
--
-- Eight of the ten are inside the bbox from the fixtures
-- (127.052, 37.615, 127.068, 37.626). They split into 3 new,
-- 4 in_progress and 1 resolved — the same counts the map fixture shows.
-- The last two are outside it. If the bbox filter breaks, we see it here
-- and not at the defense.
--
-- These are the scores calcPriority() must produce from these rows:
--   1042  min(30, 12*2.5)=30 + high 35 + 4d→3    + 2 groups→10  = 78
--   1077  min(30,  8*2.5)=20 + med  22 + 6d→4.5  + 1 group → 5  = 51.5 → 52
--   1039  min(30,  6*2.5)=15 + med  22 + 3d→2.25 + none    → 0  = 39.25 → 39
--   1012  min(30,  2*2.5)= 5 + low  12 + 3d→2.25 + 1 group → 5  = 24.25 → 24
--   0845  min(30,  3*2.5)= 7.5 + low 12 + 8d→6 (closed) + 1 group→5 = 30.5  → 31
--   1108  min(30,  4*2.5)=10 + med  22 + 2d→1.5  + 1 group → 5  = 38.5  → 39
--   1112  min(30,  5*2.5)=12.5 + med 22 + 5d→3.75 + 2 groups→10 = 48.25 → 48
--   1125  min(30,  9*2.5)=22.5 + high 35 + 7d→5.25 + 1 group→ 5 = 67.75 → 68
--   1131  min(30,  1*2.5)=2.5 + low  12 + 1d→0.75 + none    → 0 = 15.25 → 15
--   1147  min(30,  7*2.5)=17.5 + high 35 + 9d→6.75 + 2 groups→10 = 69.25 → 69
--
-- Note the rounding: we round the total, never the parts. 51.5 becomes
-- 52, and the breakdown still shows duration as 4.5.

insert into reports (
  id, device_id, category, severity, status, geom, address,
  priority_score, confirmation_count, created_at, resolved_at
) values

-- ── from contract/fixtures.json, inside the bbox ──

-- The main report. In the demo it is the duplicate found 32 m away.
('b3f1c2a4-1042-4a77-9c11-8d2e5f7a1042', '00000000-0000-4000-8000-000000000001',
 'broken_sidewalk', 'high', 'in_progress',
 st_makepoint(127.05954, 37.61987)::geography, '월계동 광운로 20 앞',
 78, 12, now() - interval '4 days', null),

-- Use this one when you want the score to go up on stage.
('c8a2d5e1-1077-4b32-9e44-2a6f8c1b3d55', '00000000-0000-4000-8000-000000000001',
 'blocked_ramp', 'medium', 'new',
 st_makepoint(127.0563, 37.6221)::geography, '월계로 3 횡단보도',
 52, 8, now() - interval '6 days', null),

('e1b7f3c9-1039-4c18-8a72-5d3e9f2a7c11', '00000000-0000-4000-8000-000000000001',
 'fallen_tree', 'medium', 'in_progress',
 st_makepoint(127.0629, 37.6172)::geography, '초안산로 가로수',
 39, 6, now() - interval '3 days', null),

('a4d9c6b2-1012-4e55-91f3-6b8a4c2d9e73', '00000000-0000-4000-8000-000000000001',
 'blocked_ramp', 'low', 'new',
 st_makepoint(127.0601, 37.6184)::geography, '광운로 12 경사로',
 24, 2, now() - interval '3 days', null),

-- Closed, with an after photo: the last frame of the demo. The demo
-- phone created it, so screen 06 shows a problem this resident followed
-- to the end.
('f6e3a1d8-0845-4d91-b2c7-9e1f5a3c8b40', '9f2c4e18-0b6a-4d3e-8f51-7c9a2b4d6e80',
 'broken_facility', 'low', 'resolved',
 st_makepoint(127.0558, 37.6243)::geography, '월계역 2번 출구 점자블록',
 31, 3, now() - interval '13 days', now() - interval '5 days'),

-- ── added so the counts match the fixture, inside the bbox ──

('1a7d4e93-1108-4f21-9c83-2b6e5d4a7f12', '00000000-0000-4000-8000-000000000001',
 'broken_sidewalk', 'medium', 'new',
 st_makepoint(127.0572, 37.6205)::geography, '인덕대학교 후문 보도',
 39, 4, now() - interval '2 days', null),

('2b8e5fa4-1112-42d7-8e14-3c7f6e5b8a23', '00000000-0000-4000-8000-000000000001',
 'broken_facility', 'medium', 'in_progress',
 st_makepoint(127.0548, 37.6168)::geography, '월계1동 주민센터 앞 벤치',
 48, 5, now() - interval '5 days', null),

('3c9f6ab5-1125-4e83-b925-4d8a7f6c9b34', '00000000-0000-4000-8000-000000000001',
 'fallen_tree', 'high', 'in_progress',
 st_makepoint(127.0651, 37.6232)::geography, '초안산 근린공원 산책로',
 68, 9, now() - interval '7 days', null),

-- ── outside the bbox: one to the south, one to the east ──

('4da07bc6-1131-4a94-8a36-5e9b8a7d0c45', '9f2c4e18-0b6a-4d3e-8f51-7c9a2b4d6e80',
 'broken_sidewalk', 'low', 'new',
 st_makepoint(127.0605, 37.6112)::geography, '석계역 1번 출구 보도',
 15, 1, now() - interval '1 day', null),

('5eb18cd7-1147-4b05-9b47-6fac9b8e1d56', '00000000-0000-4000-8000-000000000001',
 'blocked_ramp', 'high', 'new',
 st_makepoint(127.0712, 37.6201)::geography, '하계동 한글비석로 경사로',
 69, 7, now() - interval '9 days', null);


-- ─── who has the problem ─────────────────────────────────────
-- This is not only a filter. Each group adds 5 points, up to 20.

insert into affected_groups (report_id, group_code) values
  ('b3f1c2a4-1042-4a77-9c11-8d2e5f7a1042', 'wheelchair'),
  ('b3f1c2a4-1042-4a77-9c11-8d2e5f7a1042', 'elderly'),
  ('c8a2d5e1-1077-4b32-9e44-2a6f8c1b3d55', 'wheelchair'),
  ('a4d9c6b2-1012-4e55-91f3-6b8a4c2d9e73', 'stroller'),
  ('f6e3a1d8-0845-4d91-b2c7-9e1f5a3c8b40', 'visually_impaired'),
  ('1a7d4e93-1108-4f21-9c83-2b6e5d4a7f12', 'elderly'),
  ('2b8e5fa4-1112-42d7-8e14-3c7f6e5b8a23', 'elderly'),
  ('2b8e5fa4-1112-42d7-8e14-3c7f6e5b8a23', 'visually_impaired'),
  ('3c9f6ab5-1125-4e83-b925-4d8a7f6c9b34', 'elderly'),
  ('5eb18cd7-1147-4b05-9b47-6fac9b8e1d56', 'wheelchair'),
  ('5eb18cd7-1147-4b05-9b47-6fac9b8e1d56', 'stroller');

-- Reports 1039 and 1131 have no groups on purpose. We need at least one
-- report where this part of the score is zero. Otherwise a bug that
-- always adds 5 points would stay hidden.


-- ─── photos ──────────────────────────────────────────────────
-- storage.example is a placeholder. Real Supabase Storage links appear
-- here once FE-1 uploads from the phone. The map and the lists load the
-- small image only.

insert into report_photos (report_id, kind, url, thumb_url) values
  ('b3f1c2a4-1042-4a77-9c11-8d2e5f7a1042', 'before', 'https://storage.example/full/1042.jpg', 'https://storage.example/thumb/1042.jpg'),
  ('c8a2d5e1-1077-4b32-9e44-2a6f8c1b3d55', 'before', 'https://storage.example/full/1077.jpg', 'https://storage.example/thumb/1077.jpg'),
  ('e1b7f3c9-1039-4c18-8a72-5d3e9f2a7c11', 'before', 'https://storage.example/full/1039.jpg', 'https://storage.example/thumb/1039.jpg'),
  ('a4d9c6b2-1012-4e55-91f3-6b8a4c2d9e73', 'before', 'https://storage.example/full/1012.jpg', 'https://storage.example/thumb/1012.jpg'),
  ('f6e3a1d8-0845-4d91-b2c7-9e1f5a3c8b40', 'before', 'https://storage.example/full/0845.jpg', 'https://storage.example/thumb/0845.jpg'),
  ('f6e3a1d8-0845-4d91-b2c7-9e1f5a3c8b40', 'after',  'https://storage.example/full/0845-after.jpg', null),
  ('1a7d4e93-1108-4f21-9c83-2b6e5d4a7f12', 'before', 'https://storage.example/full/1108.jpg', 'https://storage.example/thumb/1108.jpg'),
  ('2b8e5fa4-1112-42d7-8e14-3c7f6e5b8a23', 'before', 'https://storage.example/full/1112.jpg', 'https://storage.example/thumb/1112.jpg'),
  ('3c9f6ab5-1125-4e83-b925-4d8a7f6c9b34', 'before', 'https://storage.example/full/1125.jpg', 'https://storage.example/thumb/1125.jpg'),
  ('4da07bc6-1131-4a94-8a36-5e9b8a7d0c45', 'before', 'https://storage.example/full/1131.jpg', 'https://storage.example/thumb/1131.jpg'),
  ('5eb18cd7-1147-4b05-9b47-6fac9b8e1d56', 'before', 'https://storage.example/full/1147.jpg', 'https://storage.example/thumb/1147.jpg');


-- ─── confirmations ───────────────────────────────────────────
-- Real rows, not just a number. confirmation_count is only a copy. The
-- real data is here, and UNIQUE (report_id, device_id) protects nothing
-- if the rows are missing. Without them a device could confirm a report
-- that already shows 12, and the 409 error would never happen until the
-- defense.

-- Creating a report also counts as confirming it. That is why a new
-- report comes back with confirmation_count 1 and confirmed_by_me true.
insert into confirmations (report_id, device_id, created_at)
select id, device_id, created_at from reports;

-- Everyone else, at random times between creation and now.
-- The demo phone is not in this list on purpose. It must be able to
-- press 확인 +1 on stage. If it had already confirmed, the app would
-- correctly answer "이미 확인하신 문제입니다" at the worst moment.
insert into confirmations (report_id, device_id, created_at)
select r.id, d.id, r.created_at + random() * (now() - r.created_at)
from reports r
join lateral (
  select dev.id
  from devices dev
  where dev.id <> r.device_id
    and dev.id <> '9f2c4e18-0b6a-4d3e-8f51-7c9a2b4d6e80'
  order by random()
  limit r.confirmation_count - 1
) d on true;


-- ─── status history ──────────────────────────────────────────
-- Screen 05 builds the 진행 상황 block from this table.

-- Every report starts with a null → new row, written by the system.
insert into status_logs (report_id, from_status, to_status, created_at)
select id, null, 'new', created_at from reports;

-- Reports an operator picked up. The date is three quarters of the way
-- between creation and either the closing date or now.
insert into status_logs (report_id, from_status, to_status, admin_id, note, created_at)
select r.id, 'new', 'in_progress',
       (select id from admins limit 1), '노원구 도로과',
       r.created_at + (coalesce(r.resolved_at, now()) - r.created_at) * 0.75
from reports r
where r.status in ('in_progress', 'resolved');

insert into status_logs (report_id, from_status, to_status, admin_id, note, created_at)
select r.id, 'in_progress', 'resolved',
       (select id from admins limit 1), '점자블록 교체 완료',
       r.resolved_at
from reports r
where r.status = 'resolved';


-- ─── how to check ────────────────────────────────────────────
-- Run these after the seed. Each one must give what the comment says.
--
-- 10 reports, 62 devices:
--   select (select count(*) from reports)  as reports,
--          (select count(*) from devices)  as devices;
--
-- The copy matches the real data. This must return NO rows:
--   select r.id, r.confirmation_count, count(c.id) as actual
--   from reports r left join confirmations c on c.report_id = r.id
--   group by r.id, r.confirmation_count
--   having r.confirmation_count <> count(c.id);
--
-- The counts inside the map bbox — 3 new, 4 in_progress, 1 resolved:
--   select status, count(*) from reports
--   where geom && st_makeenvelope(127.052, 37.615, 127.068, 37.626, 4326)::geography
--   group by status;
--
-- The main report: 4 days old and worth 78:
--   select priority_score, confirmation_count,
--          round(extract(epoch from now() - created_at) / 86400, 2) as days_open
--   from reports where id = 'b3f1c2a4-1042-4a77-9c11-8d2e5f7a1042';
