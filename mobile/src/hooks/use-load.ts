/**
 * The plain load every screen needs (CLAUDE.md, rule 8): load once when
 * the screen opens, and again on pull-to-refresh.
 *
 * `key` says when to load again: pass the report id on the detail
 * screen. `load` itself is usually a new arrow function on every render,
 * so it cannot be the trigger — that would load forever.
 */

import { useCallback, useEffect, useState } from 'react';

export function useLoad<T>(load: () => Promise<T>, key: string = '') {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => {
    try {
      setData(await load());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다.');
    }
  }, [key]);

  useEffect(() => {
    run();
  }, [run]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await run();
    setRefreshing(false);
  }, [run]);

  return { data, error, refreshing, refresh };
}
