/**
 * Turning contract values into text. The server sends ISO dates in UTC;
 * residents read dates in Korean time.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Whole days since the date: "4일". */
export function daysSince(iso: string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS));
}

/** "9월 13일", in Korean time. Done by hand: Intl time zones are not on every phone. */
export function monthDay(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`;
}

/** Breakdown parts are not rounded on the server (4.5). Show at most one decimal. */
export function points(value: number): string {
  return String(Math.round(value * 10) / 10);
}
