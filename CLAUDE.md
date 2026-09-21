# 동네 SOS

An app about physical barriers in the neighborhood (배리어프리 및 생활편의).
Product core: **one problem → collective confirmation → numeric priority → closing the loop with a result photo.**

A similar problem 50 meters away is not a new report — it is a `확인 +1` on the existing one.
If a change does not serve that sentence, it should not be made.

## Rules for AI agents — ask first, act second

These apply to Claude Code and any other agent working in this repository. We work as a team, so nothing lands without a human saying yes.

1. **Never push to `main`.** Work on `dev` or a feature branch. `main` is reached only through a pull request that a human opens and merges.
2. **Never commit or push unless explicitly asked.** Prepare the change, show the diff, and stop. The human runs the commit.
3. **Never rewrite history.** No `--force` / `--force-with-lease` push, no `rebase`, no `commit --amend`, no `reset --hard`, no `filter-branch`. Someone else's work is inside that history.
4. **Never delete branches, and never run `git clean -f` or `rm -rf`.** Delete named files one at a time, with permission.
5. **Never change git config** or any other shared repository setting.
6. **Never merge a pull request.** Review and comment are fine; merging is a human decision.
7. **Edit only the directories you own** (see the ownership map below). A change in a neighbor's directory is a request to that neighbor, not an edit.
8. **`contract/**` and `CLAUDE.md` are frozen** — see the contract section. Do not edit them alone, and do not edit them through the shell to get around this rule.
9. **Ask before touching shared state:** `npm run db:migrate`, `npm run db:seed`, anything that writes to the shared database, and anything that deploys.
10. **Ask before anything irreversible or visible outside the repo** — pushing, opening a PR, posting, deleting, or overwriting a file you have not read.

When a rule blocks the task, say so and stop. Do not look for a way around it.

## Stack

- Mobile: React Native + Expo (TypeScript)
- API: Node + Express (TypeScript), exactly 9 endpoints
- Data: Supabase — PostgreSQL + PostGIS, Storage, Realtime
- Admin: React (web), a separate project in `/admin-web`
- Map: Kakao Maps SDK (client only)

## The contract — read before writing code

- `contract/types.ts` — the single source of truth for data shapes
- `contract/fixtures.json` — real response examples for every endpoint
- `contract/README.md` — all 9 endpoints in one list

**Frozen since the evening of 21.09.2026.** Change it only as a whole team, out loud, never alone.

## Rules you must not break

1. **snake_case everywhere.** JSON field names = database column names. No camelCase, no conversion layer.
2. **One screen — one API request; inside it, one database query.** Dozens of identical SQL statements in the log means N+1 — rewrite it.
3. **Edit only your own directory** (ownership map below). Need a change in a neighbor's code — ask the neighbor.
4. **Priority is computed on the server only**, in a single `calcPriority()` function. The client receives a finished number and a finished breakdown.
5. **`확인 +1` is one transaction:** insert into `confirmations` + increment `confirmation_count` + recompute `priority_score`. All of it, or none of it.
6. **Every external feature can be switched off.** AI classification and speech recognition get a 3 s timeout and fail quietly — the user simply fills in the form.
7. **Photos are compressed on the device** to 1280 px / q70 before upload. Map and lists show the thumbnail only (`before_thumb_url`). The full image appears only on the detail screen.
8. **A realtime subscription lives only while the screen is visible.** Backgrounded means unsubscribed. Every screen also has a plain load and pull-to-refresh.
9. **Device identification:** every request carries the `X-Device-Id` header. Residents do not register. Only the admin operator logs in.
10. **Never log exact coordinates and `X-Device-Id` together** — that is deanonymization.

## File ownership

| Who | Directories |
|---|---|
| BE-1 · data core | `db/**`, `src/core/**` |
| BE-2 · reads, admin, deploy | `src/read/**`, `src/admin/**`, `admin-web/**` |
| FE-1 · create path | `app/screens/report/**` |
| FE-2 · browse path | `app/screens/browse/**` |
| Everyone (frozen since 22.09) | `contract/**`, `CLAUDE.md` |

## Enum values — closed lists

```
category  : fallen_tree | broken_sidewalk | blocked_ramp | broken_facility
status    : new | in_progress | resolved
severity  : low | medium | high
group     : wheelchair | elderly | stroller | visually_impaired
photo.kind: before | after
```

Do not add new values. If a new one is needed — conversation first, code after.

## Priority formula (0–100)

```
confirmations : min(30, count * 2.5)
severity      : low 12 | medium 22 | high 35
duration      : min(15, days_open * 0.75)
impact        : min(20, groups * 5)
```

Reference case: 13 confirmations, `high`, 4 days, 2 groups → 30 + 35 + 3 + 10 = **78**.
If your code does not produce 78, it is wrong.

## Deadlines

Defense on **28.09.2026**. End-to-end path on the real API by the evening of **25.09**.
Code freeze on the evening of **27.09**; after that, rehearsal only.

## Commands

```bash
npm run dev          # API on :3000
npm run mock         # mock server on fixtures, :3001
npm run db:migrate   # apply migrations
npm run db:seed      # 10 demo reports around 월계동
npm start            # Expo
```

## A task is done when

- it runs not only for its author, but for a teammate too;
- it works on data from `contract/fixtures.json`, not on invented data;
- it is visible in the end-to-end demo scenario;
- the branch is merged into `main` the same day.

## What not to do

- Do not add chat, ratings, a feed, or social features.
- Do not add categories "just in case" — there are exactly four.
- Do not build complex authorization. Residents have none at all.
- Do not rename contract fields alone.
- Do not optimize what has not been measured.
