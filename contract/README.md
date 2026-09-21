# Contract — 동네 SOS

Three files, one source of truth:

- `types.ts` — the data shapes. Field names here = column names in the database = keys in JSON.
- `fixtures.json` — a real response example for every endpoint. The mock server, the database seed and the frontend tests all read this same file.
- `README.md` — this file: all 9 endpoints in one list.

**Frozen since the evening of 21.09.2026.** Change it only as a whole team, out loud, never alone.

## Rules that apply to every endpoint

- **snake_case everywhere.** No camelCase, no conversion layer.
- **`X-Device-Id` on every request.** Anonymous device identifier; residents never register. Only the admin operator logs in, and only for the two `/api/admin/*` endpoints.
- **Errors always have the same shape** — `ApiError`, with `error.code` from a closed list: `already_confirmed` (409), `report_not_found` (404), `rate_limited` (429), `invalid_payload` (400), `unauthorized` (401), `internal` (500). `error.message` is Korean text; show it as is.
- **Priority is computed on the server only**, in `calcPriority()`. The client receives a finished `priority_score` and a finished `priority_breakdown`. Reference case: 13 confirmations, `high`, 4 days, 2 groups → **78**.
- **Never log exact coordinates together with `X-Device-Id`.**

## The 9 endpoints

### Resident — create path

**1. `POST /api/reports/nearby`** — is there already a problem like this nearby?
`NearbyRequest` { lat, lng, category } → `NearbyResponse` { duplicate, radius_m }.
`duplicate: null` means no match — show the create form. A non-null `duplicate` is the existing Report, and the screen offers `확인 +1` instead of a new report. Search radius is `DUPLICATE_RADIUS_M` = 50 m, ignoring anything older than `DUPLICATE_MAX_AGE_DAYS` = 30 days.

**2. `POST /api/reports`** — create a new problem.
`CreateReportRequest` { lat, lng, category, severity, affected_groups, photo_url, photo_thumb_url, description? } → `CreateReportResponse` (= `Report`).
The phone uploads the photo to Supabase Storage itself and sends the two links. Photos are compressed on the device to 1280 px / q70 first. A fresh report comes back with `confirmation_count: 1` and `confirmed_by_me: true`.

**3. `POST /api/reports/:id/confirm`** — `확인 +1`.
No body; the caller is identified by the `X-Device-Id` header. → `ConfirmResponse` { report, previous_confirmation_count, previous_priority_score }.
The previous values are what the client animates from ("12 → 13"). One transaction: insert into `confirmations` + increment `confirmation_count` + recompute `priority_score` — all of it, or none of it. A device that already confirmed gets `already_confirmed` (409).

### Resident — browse path

**4. `GET /api/reports?bbox=minLng,minLat,maxLng,maxLat`** — points for the map.
→ `MapResponse` { reports, counts }.
`counts` is per status, for the `전체 · 신규 · 처리중` chips. List items carry `before_thumb_url` only, and `priority_breakdown` may be absent here. Coordinates on the public map are rounded to ~4 decimals.

**5. `GET /api/reports/:id`** — details.
→ `ReportDetailResponse` (= `Report`), and here the Report always carries `priority_breakdown` and `status_log`. This is the only screen that loads the full `before_url` image.

### Optional helpers — must degrade quietly

**6. `POST /api/classify`** — photo to category.
→ `ClassifyResponse` { category, confidence }.
3 s timeout. `category: null` is **not an error**: screen 02 simply shows no hint and the user picks the category with the buttons. Below `confidence` 0.6 the hint is not shown either.

**7. `POST /api/voice/draft`** — speech to a draft report.
→ `VoiceDraftResponse` { transcript, category, affected_groups }.
3 s timeout, same quiet failure: on a service outage it returns an empty transcript, `category: null` and an empty group list, and the user fills in the form by hand.

### Admin — operator only

**8. `PATCH /api/admin/reports/:id/status`** — move the status.
`UpdateStatusRequest` { status, note? } → `Report` with the updated status and a new `status_log` entry. The note is the responsible office, e.g. `노원구 도로과`.

**9. `PATCH /api/admin/reports/:id/resolve`** — close the loop.
`ResolveRequest` { after_photo_url, note? } → `Report` with `status: "resolved"`, `resolved_at` set and `photos.after_url` filled in. This is the final frame of the demo.

## Enums — closed lists

```
category  : fallen_tree | broken_sidewalk | blocked_ramp | broken_facility
status    : new | in_progress | resolved
severity  : low | medium | high
group     : wheelchair | elderly | stroller | visually_impaired
photo.kind: before | after
```

Do not add new values. If a new one is needed — conversation first, code after.
