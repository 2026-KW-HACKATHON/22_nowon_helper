<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./.github/assets/logo-dark.svg">
    <img src="./.github/assets/logo-light.svg" width="360" alt="동네 SOS">
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

A fallen tree on the path, a broken sidewalk, a blocked ramp, a broken bench:
small things that stop a wheelchair, a stroller or an older person.

Residents report them from their phone. The district office fixes them.
Everyone sees the result.

> **one problem → collective confirmation → numeric priority → closing the loop with a result photo**

A similar problem 50 m away is not a new report. It is a `확인 +1` on the old
one. So the office gets **one** report with twenty confirmations, not twenty
copies of the same hole.

Made for the 2026 KW Hackathon (광운대학교), topic *배리어프리 및 생활편의*.

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

**The API.** Needs Node 22.18+ and the `.env` values from a teammate.

```bash
npm install
cp .env.example .env     # fill in the values
npm run dev              # http://localhost:3000
```

**The app.** Install Expo Go on your phone.

```bash
cd mobile
npm install
npx expo start -c        # scan the QR code
```

To use the real API, create `mobile/.env`:

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

## Roadmap

| | | |
|---|---|---|
| ✅ | contract, database, mobile screens | |
| ✅ | API: all 9 endpoints on Supabase | |
| ✅ | Kakao map in the app | |
| 🔜 | deploy to Railway | |
| 🔜 | real photos, admin web, live updates | |
| 🎤 | demo | 28.09.2026 |

## License

[MIT](./LICENSE)
