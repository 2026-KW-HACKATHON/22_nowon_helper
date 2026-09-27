-- ─────────────────────────────────────────────────────────────
-- 0001_init.sql — first schema for 동네 SOS.
--
-- Owner: BE-1 (db/**, src/core/**).
-- Field names come from contract/types.ts. Column name = JSON key.
-- snake_case everywhere.
--
-- How to run: paste the whole file into the Supabase SQL Editor and press
-- Run. Or use `psql -f`.
--
-- Postgres runs the whole file as one transaction. If one line fails,
-- nothing is created. So a failed run is safe: fix it and run again.
--
-- Run this file once, on an empty database. `create type` has no
-- IF NOT EXISTS, so a second run stops at the first enum. That is on
-- purpose.
-- ─────────────────────────────────────────────────────────────


-- ─── extensions ──────────────────────────────────────────────
-- PostGIS lets Postgres work with maps. It answers the main question of
-- this product: "what is within 50 m of this point?"
--
-- Supabase keeps extensions in a schema called `extensions`. That schema
-- is on the search path, so we can write `geography` and `ST_*` without
-- a prefix.

create extension if not exists postgis with schema extensions;


-- ─── enums: fixed lists of values (see CLAUDE.md) ────────────
-- The database checks these, not our code. A typo like
-- 'brocken_sidewalk' fails on insert. Without enums it would be saved,
-- and we would find it during the demo.

create type category       as enum ('fallen_tree', 'broken_sidewalk', 'blocked_ramp', 'broken_facility');
create type status         as enum ('new', 'in_progress', 'resolved');
create type severity       as enum ('low', 'medium', 'high');
create type affected_group as enum ('wheelchair', 'elderly', 'stroller', 'visually_impaired');
create type photo_kind     as enum ('before', 'after');

-- Only for us. The contract does not describe operators.
create type admin_role     as enum ('operator', 'supervisor');


-- ─── devices: one anonymous resident ─────────────────────────
-- `id` is the value from the X-Device-Id header. The phone sends it, we
-- do not generate it. No name, no phone number, no email: residents do
-- not sign up.

create table devices (
  id         uuid primary key,
  created_at timestamptz not null default now()
);


-- ─── admins: district operators ──────────────────────────────
-- The only users with a password. The password itself is kept by
-- Supabase Auth. This table only holds the profile.
-- `department` is the office name, for example "노원구 도로과".

create table admins (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  department text,
  role       admin_role not null default 'operator',
  created_at timestamptz not null default now()
);


-- ─── reports: one problem ────────────────────────────────────
-- `geom` is one map point, not two numbers. PostGIS can then measure
-- distance in metres by itself and use a map index. The API still sends
-- `lat` and `lng`: we read them back with ST_Y(geom) and ST_X(geom).
--
-- `confirmation_count` is a copy of something we could count in the
-- `confirmations` table. We keep the copy because the map draws a
-- hundred pins at once and counting for each one is slow. The copy
-- cannot go out of sync: both change in the same transaction.
--
-- `priority_score` is written by calcPriority() in src/core. The formula
-- never lives in SQL.

create table reports (
  id                 uuid primary key default gen_random_uuid(),
  device_id          uuid not null references devices(id),
  category           category not null,
  severity           severity not null,
  status             status   not null default 'new',
  geom               geography(Point, 4326) not null,
  address            text not null default '',
  description        text,
  priority_score     integer not null default 0,
  confirmation_count integer not null default 0,
  created_at         timestamptz not null default now(),
  resolved_at        timestamptz
);

-- An index works like the index at the end of a book. Without one, the
-- database reads every row.
--   1. GIST is a special index for maps. It handles the 50 m radius.
--   2. The second one handles the other two parts of the same search:
--      same category, not resolved yet.
--   3. The third one is for the admin list, which sorts by score.
create index reports_geom_gix       on reports using gist (geom);
create index reports_cat_status_idx on reports (category, status);
create index reports_priority_idx   on reports (priority_score desc);


-- ─── confirmations: 확인 +1 ─────────────────────────────────
-- UNIQUE (report_id, device_id) is the most important line in this file.
-- One device can confirm one problem only once. This is a database rule,
-- so bad code or ten taps on the button cannot break it. When the
-- database rejects the insert, the API turns that into
-- `already_confirmed` (409).

create table confirmations (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references reports(id) on delete cascade,
  device_id  uuid not null references devices(id),
  created_at timestamptz not null default now(),
  unique (report_id, device_id)
);

-- `on delete cascade` above: if a report is deleted, its confirmations
-- go with it.

-- For the rate limit: 20 confirmations per device per day.
create index confirmations_device_idx on confirmations (device_id, created_at);


-- ─── affected_groups: who has the problem ────────────────────
-- The primary key covers both columns. So one group cannot be saved
-- twice for the same report. If it could, someone could push the impact
-- part of the priority up to its cap of 20 with one group.

create table affected_groups (
  report_id  uuid not null references reports(id) on delete cascade,
  group_code affected_group not null,
  primary key (report_id, group_code)
);


-- ─── report_photos ───────────────────────────────────────────
-- The file itself is in Supabase Storage. The database keeps only the
-- link. `thumb_url` is filled for 'before' photos only: the map and the
-- lists load the small image and nothing else.

create table report_photos (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references reports(id) on delete cascade,
  kind       photo_kind not null,
  url        text not null,
  thumb_url  text,
  created_at timestamptz not null default now()
);

create index report_photos_report_idx on report_photos (report_id);


-- ─── status_logs: history for the 진행 상황 block ───────────
-- `from_status` is null in the first row, because there is no previous
-- status yet. `admin_id` is null when the system wrote the row instead
-- of an operator.

create table status_logs (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references reports(id) on delete cascade,
  from_status status,
  to_status   status not null,
  admin_id    uuid references admins(id),
  note        text,
  created_at  timestamptz not null default now()
);

create index status_logs_report_idx on status_logs (report_id, created_at);


-- ─── row level security (RLS) ────────────────────────────────
-- RLS means: nothing is allowed until we allow it.
--
-- Three kinds of caller:
--   1. Our Express server. It uses the service_role key and ignores RLS.
--      Nothing to set up for it.
--   2. The resident's phone. It reads data through our API. It touches
--      the database directly only to get realtime updates on reports.
--   3. Everyone else. No access at all.
--
-- The project was created with automatic RLS, so these lines usually
-- change nothing. We keep them so that a teammate who runs this file on
-- a new database gets the same protection.

alter table devices         enable row level security;
alter table admins          enable row level security;
alter table reports         enable row level security;
alter table confirmations   enable row level security;
alter table affected_groups enable row level security;
alter table report_photos   enable row level security;
alter table status_logs     enable row level security;


-- ─── what the phone may read directly ────────────────────────
-- Two locks, and we need both. The grant controls columns. The policy
-- controls rows. With RLS on, a grant alone shows nothing.
--
-- `geom` and `device_id` are not in the list on purpose. Together they
-- tell you "this device took a photo at this address", and the project
-- does not allow that. Exact coordinates leave only through our server,
-- rounded to about 4 decimals, as the contract says.
--
-- SELECT only. Nobody can create a report or change a counter without
-- going through the server.

grant usage on schema public to anon;

grant select (
  id, category, severity, status,
  priority_score, confirmation_count,
  address, created_at, resolved_at
) on reports to anon;

create policy "anon reads reports"
  on reports for select
  to anon
  using (true);


-- ─── realtime ────────────────────────────────────────────────
-- `supabase_realtime` is the list of tables the database reports changes
-- for. It is empty by default, so without this line nothing is sent.
--
-- The column list matters. Without it the database sends the whole row,
-- including `device_id` and the exact `geom`. That would undo the grant
-- above. These four columns are all the screens need: the counter
-- 12 → 13 and the status. `id` tells the client which card to update.
--
-- We keep replica identity DEFAULT (the primary key). FULL would also
-- send the old values, but FULL does not work together with a column
-- list, and the client already knows the old value.

alter publication supabase_realtime add table reports (
  id, status, priority_score, confirmation_count
);


-- ─── how to check ────────────────────────────────────────────
-- select table_name from information_schema.tables
--   where table_schema = 'public' order by table_name;      -- 7 rows
-- select tablename, policyname, cmd from pg_policies
--   where schemaname = 'public';                            -- reports / SELECT
-- select schemaname, tablename from pg_publication_tables
--   where pubname = 'supabase_realtime';                    -- public / reports
