# 동네 SOS — mobile

The resident app: React Native + Expo, routing with expo-router.

## Run

```bash
cd mobile
npm install
npm start        # then press w for the browser, or scan the QR code with Expo Go
```

## Where the data comes from

Every screen gets its data from `src/api/index.ts`, and only from there.
Today those functions answer from `../contract/fixtures.json`, because
the real API does not exist yet. When it does, only `src/api/` changes.

The app imports `../contract/types.ts` and `../contract/fixtures.json`
from outside this folder. `metro.config.js` lets Metro see them.

## Layout

```
src/app/            screens (expo-router: file = route)
  index.tsx         map + the most urgent problem
  detail.tsx        one problem: score breakdown, 진행 상황, before/after
  reports.tsx       내 신고 (temporary: the problems this device confirmed)
src/api/            the only way to get data
src/components/     shared pieces (bottom-nav)
src/hooks/          use-load: plain load + pull-to-refresh
src/labels.ts       Korean labels for the contract enums
src/format.ts       dates and numbers as text
```
