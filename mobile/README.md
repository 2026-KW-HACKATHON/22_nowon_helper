# Bumpy — mobile

The resident app: React Native + Expo, routing with expo-router.

## Run

```bash
cd mobile
npm install
npx expo start -c   # then press w for the browser, or scan the QR code with Expo Go
```

## Where the data comes from

Every screen gets its data from `src/api/index.ts`, and only from there.

- No `mobile/.env` → those functions answer from `../contract/fixtures.json`,
  so the app runs without a server.
- `EXPO_PUBLIC_API_URL=http://<your Wi-Fi IP>:3000` in `mobile/.env` → the
  real API (`npm run dev` in the repository root).
- Photos: until Supabase Storage is connected, the upload returns the sample
  image links from the fixtures (`USE_MOCK_UPLOAD` in `src/api/config.ts`).

The app imports `../contract/types.ts` and `../contract/fixtures.json`
from outside this folder. `metro.config.js` lets Metro see them.

## Layout

```
src/app/            screens (expo-router: file = route)
  index.tsx         01 home: pick what is wrong, problems already reported nearby
  map.tsx           04 map: pins, status counts, the most urgent problem
  detail.tsx        one problem: score breakdown, 진행 상황, before/after
  reports.tsx       내 신고 (for now: the problems this device confirmed)
  report/           the report flow
    index.tsx       camera + GPS, photo compression
    category.tsx    02 (1/2): category, severity, affected groups
    duplicate.tsx   03 (2/2): already reported nearby → 확인 +1
    done.tsx        new report created: the score from the server
src/api/            the only way to get data
src/report/         report flow helpers: draft, photo, location, submit
src/components/     shared pieces: bottom nav, icons, map
src/hooks/          use-load: plain load + pull-to-refresh
src/labels.ts       Korean labels for the contract enums
src/format.ts       dates and numbers as text
```
