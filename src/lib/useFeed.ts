import { useCallback, useEffect, useState } from 'react';

// Wspólna obsługa ładowania, odświeżania i błędów dla list z kanałów RSS.
export function useFeed<T>(load: () => Promise<T[]>, deps: unknown[]) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (isRefresh: boolean) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      setItems(await load());
    } catch {
      setError('Nie udało się pobrać danych. Sprawdź połączenie z internetem.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run(false);
  }, [run]);

  return { items, loading, refreshing, error, refresh: () => run(true), retry: () => run(false) };
}
