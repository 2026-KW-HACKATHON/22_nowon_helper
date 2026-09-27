<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./.github/assets/logo-dark.svg">
    <img src="./.github/assets/logo-light.svg" width="280" alt="Bumpy">
  </picture>
</h1>

<p align="center">
  <i>Report a barrier once. The neighborhood confirms it. The district fixes it 🦽</i>
</p>

<h4 align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-555?style=flat-square" alt="license"></a>
  <a href="./package.json"><img src="https://img.shields.io/badge/node-22.18+-555?style=flat-square" alt="node"></a>
  <a href="./mobile"><img src="https://img.shields.io/badge/app-expo%20go-555?style=flat-square" alt="expo go"></a>
  <a href="./contract/README.md"><img src="https://img.shields.io/badge/api-9%20endpoints-555?style=flat-square" alt="api"></a>
  <a href="#the-priority"><img src="https://img.shields.io/badge/priority-0%E2%80%93100-555?style=flat-square" alt="priority"></a>
</h4>

<p align="center">
  <img src="./.github/assets/cycle.svg" width="100%" alt="the loop: photo, duplicate check, 확인 +1, priority, in progress, resolved with an after photo">
</p>

## What is this

A broken sidewalk, a blocked ramp, a broken bench: small things that stop a
wheelchair, a stroller, an older or a visually impaired person.

Today the same problem is reported many times, nobody knows what to fix
first, and the resident never learns what happened.

**Bumpy** is a report that takes one photo. Residents report from their
phone. The district office fixes. Everyone sees the result.

> **one problem → collective confirmation → numeric priority → closing the loop with a result photo**

A similar problem 50 m away is not a new report. It is a `확인 +1` on the old
one. So the office gets **one** report with twenty confirmations, not twenty
copies of the same hole.

Made for the 2026 KW Hackathon (광운대학교) by team **4guys**, topic
*배리어프리 및 생활편의*.

| | who | part |
|---|---|---|
| BE-1 | 장막심 | data core: database, create path, priority |
| BE-2 | 아얀 | reads, admin, deploy |
| FE-1 | 한안드레이 | report flow in the app |
| FE-2 | 이막심 | browse screens in the app |

## How it works

<details open>
<summary><b>One problem, not twenty</b></summary> <br />

Before a new report is created, the server asks: is there an open report of
the same category within 50 m? If yes, the resident gets a `확인 +1` button
instead of a form. One phone can confirm one report only once. The database
itself says no to the second time.

<p align="center">
  <img src="./.github/assets/duplicate.svg" width="100%" alt="duplicate search within 50 meters">
</p>

</details>

<details open>
<summary><b>A number you can explain</b></summary> <br />

<a id="the-priority"></a>

Every report has a score from 0 to 100, and the app shows **why**:

```
confirmations : min(30, count × 2.5)
severity      : low 12 · medium 22 · high 35
duration      : min(15, days open × 0.75)
impact        : min(20, groups × 5)
```

<p align="center">
  <img src="./.github/assets/priority.svg" width="100%" alt="priority 78 split into four parts">
</p>

13 confirmations, `high`, 4 days, 2 groups → **78**. If the code does not give
78, the code is wrong (`npm test` checks it). The score is computed in one
place only: [`src/core/priority.ts`](./src/core/priority.ts).

</details>

<details open>
<summary><b>Who talks to whom</b></summary> <br />

<p align="center">
  <img src="./.github/assets/system.svg" width="100%" alt="system map">
</p>

Residents do not register: the phone sends an anonymous `X-Device-Id`.
Only the district operator logs in.

</details>

## Run it

**Try it in two minutes, no keys.** Needs Node 22.18+ and Expo Go on your
phone (or press `w` for the browser).

```bash
cd mobile
npm install
npx expo start -c        # scan the QR code
```

With no `.env` the app answers from
[`contract/fixtures.json`](./contract/fixtures.json): every screen and the
whole report flow work without a server.

**The priority formula.** No database needed.

```bash
npm install
npm test                 # 18 tests, including the reference case → 78
```

**The real API.** Needs the Supabase values in `.env`
(see [`.env.example`](./.env.example)).

```bash
cp .env.example .env     # fill in the values
npm run dev              # http://localhost:3000
```

Then point the app at it with `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
EXPO_PUBLIC_KAKAO_JS_KEY=...
```

- Your computer's Wi-Fi IP, **with** `http://` and the port.
- No API URL → the app runs on [`contract/fixtures.json`](./contract/fixtures.json), no server needed.
- No Kakao key → the map shows OpenStreetMap.
- Changed `.env`? Restart with `-c`.

## The API

| | endpoint | |
|---|---|---|
| 1 | `POST /api/reports/nearby` | same problem within 50 m? |
| 2 | `POST /api/reports` | new report |
| 3 | `POST /api/reports/:id/confirm` | `확인 +1` |
| 4 | `GET /api/reports?bbox=` | map pins + counts |
| 5 | `GET /api/reports/:id` | details |
| 6 | `POST /api/classify` | photo → category *(off for now)* |
| 7 | `POST /api/voice/draft` | voice → draft *(off for now)* |
| 8 | `PATCH /api/admin/reports/:id/status` | operator: in progress |
| 9 | `PATCH /api/admin/reports/:id/resolve` | operator: close with a photo |

Shapes: [`contract/types.ts`](./contract/types.ts) · examples:
[`contract/fixtures.json`](./contract/fixtures.json) · rules:
[`contract/README.md`](./contract/README.md)

## Commands

| | |
|---|---|
| `npm run dev` | API, restarts on save |
| `npm test` | priority formula |
| `npm run db:check` | is the database OK? (read-only) |
| `npm run db:seed` | ⚠️ **deletes everything**, loads 10 demo reports. Tell the team first |

## How we work

1. Take an [issue](../../issues) and assign yourself.
2. Branch from `dev`: `fix/12-empty-address`.
3. Fix it, check it on the phone.
4. Pull request into `dev` with `Closes #12`. Someone else merges it.

**snake_case everywhere · one screen = one request · priority only on the
server · four categories, no more · no keys in git or chat.**
All the rules: [`CLAUDE.md`](./CLAUDE.md).

## Plan vs code

What the 중간발표 report says, and where it lives.

**Done**

| report | code |
|---|---|
| 9 APIs on the real database | [`src/server.ts`](./src/server.ts), Supabase PostgreSQL |
| 50 m duplicate search with PostGIS | [`src/core/create.ts`](./src/core/create.ts) — `st_dwithin`, 50 m, last 30 days |
| `확인 +1` in one transaction, once per device | [`src/core/create.ts`](./src/core/create.ts), `UNIQUE (report_id, device_id)` in [`db/migrations/0001_init.sql`](./db/migrations/0001_init.sql) |
| priority on the server, 18 automated tests | [`src/core/priority.ts`](./src/core/priority.ts), [`priority.test.ts`](./src/core/priority.test.ts), [`seed-scores.test.ts`](./src/core/seed-scores.test.ts) |
| home — problems nearby | [`mobile/src/app/index.tsx`](./mobile/src/app/index.tsx) |
| map | [`mobile/src/app/map.tsx`](./mobile/src/app/map.tsx) |
| detail — score breakdown, 진행 상황 | [`mobile/src/app/detail.tsx`](./mobile/src/app/detail.tsx) |
| 내 신고 | [`mobile/src/app/reports.tsx`](./mobile/src/app/reports.tsx) |
| report flow — camera, GPS, compression → problem → duplicate check → done | [`mobile/src/app/report/`](./mobile/src/app/report), compression 1280 px / q70 in [`mobile/src/report/photo.ts`](./mobile/src/report/photo.ts) |

**Not done yet** — next, in this order

| report | today |
|---|---|
| photo upload to Supabase Storage | sample images from the fixtures ([`mobile/src/api/upload.ts`](./mobile/src/api/upload.ts)) |
| admin screen that closes a report with the result photo | the API is ready (endpoints 8 and 9), the screen is not |
| AI photo classification, voice input | the place on the screen only; the resident fills in the form by hand ([`src/core/optional.ts`](./src/core/optional.ts)) |
| server deploy | runs locally; [`railway.json`](./railway.json) is ready |

## Roadmap

| | | |
|---|---|---|
| ✅ | contract, database, 9 APIs on Supabase | |
| ✅ | app: home, map, detail, 내 신고, report flow | |
| 🎤 | 중간발표 | 28.09.2026 |
| 🔜 | photo upload to Supabase Storage | |
| 🔜 | admin screen: close a report with the result photo | |
| 🔜 | AI photo classification, voice input (3 s limit, then the form) | |
| 🔜 | server deploy | |

## License

[MIT](./LICENSE)
