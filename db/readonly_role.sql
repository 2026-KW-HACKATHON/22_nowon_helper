-- ─────────────────────────────────────────────────────────────
-- readonly_role.sql — a login that can read every table and change
-- nothing. For teammates who want to run `npm run db:check` against the
-- shared database without holding the postgres password.
--
-- Owner: BE-1 (db/**, src/core/**).
--
-- This is not a migration. The app does not need it. Run it once, by
-- hand, in the Supabase SQL Editor, after 0001_init.sql.
--
-- The password is NOT in this file, on purpose: this file is in git.
-- After running it, set the password in the SQL Editor yourself:
--
--   alter role readonly_check with password '...';
--
-- and send the connection string to a teammate in a private message.
-- In the connection string the user becomes `readonly_check.<project-ref>`
-- when you connect through the Supabase pooler.
-- ─────────────────────────────────────────────────────────────


create role readonly_check login;

-- check.sql uses st_makeenvelope from PostGIS, which lives in the
-- `extensions` schema.
grant usage on schema public, extensions to readonly_check;
alter role readonly_check set search_path = public, extensions;

-- Read every table that exists now, and every table added later.
grant select on all tables in schema public to readonly_check;
alter default privileges in schema public grant select on tables to readonly_check;

-- A grant alone is not enough: RLS is on for every table, and with RLS
-- a role sees no rows until a policy lets it. One read policy per table.
-- A table added in a later migration needs its own line here.
create policy "readonly_check reads" on devices         for select to readonly_check using (true);
create policy "readonly_check reads" on admins          for select to readonly_check using (true);
create policy "readonly_check reads" on reports         for select to readonly_check using (true);
create policy "readonly_check reads" on confirmations   for select to readonly_check using (true);
create policy "readonly_check reads" on affected_groups for select to readonly_check using (true);
create policy "readonly_check reads" on report_photos   for select to readonly_check using (true);
create policy "readonly_check reads" on status_logs     for select to readonly_check using (true);

-- No insert, update or delete grants anywhere. Even if check.sql had a
-- mistake, this role could not change a row.


-- ─── how to undo ─────────────────────────────────────────────
-- drop policy "readonly_check reads" on devices;          -- and the other six
-- revoke all on all tables in schema public from readonly_check;
-- alter default privileges in schema public revoke select on tables from readonly_check;
-- revoke usage on schema public, extensions from readonly_check;
-- drop role readonly_check;
