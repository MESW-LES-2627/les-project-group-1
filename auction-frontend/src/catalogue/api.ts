import { useEffect, useState } from 'react';

/**
 * Catalogue API helpers
 *
 * Builds the backend URL (same rule used by AuctionApp) and provides a small hook
 * to fetch JSON data with loading and error state.
 */

const API_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin)
).replace(/\/+$/, '');

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string;
}

// Fetches `path` from the backend and refetches whenever the path changes.
export function useApi<T>(path: string): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: '' }));

    fetch(`${API_URL}${path}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Not found' : `Request failed with status ${response.status}`);
        }
        return response.json() as Promise<T>;
      })
      .then((data) => setState({ data, loading: false, error: '' }))
      .catch((error: Error) => {
        if (error.name === 'AbortError') return;
        setState({ data: null, loading: false, error: error.message });
      });

    return () => controller.abort();
  }, [path]);

  return state;
}