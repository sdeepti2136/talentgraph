import { useEffect, useState, useCallback } from "react";

/**
 * Runs an async fetcher on mount (and whenever deps change), tracking
 * loading/error/data so pages can render the right state without
 * duplicating the same try/catch everywhere.
 */
export function useApiData(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const load = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });
    return () => {
      cancelled = true;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => load(), [load]);

  return { ...state, reload: load };
}
