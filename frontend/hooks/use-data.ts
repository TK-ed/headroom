"use client";

import { useEffect, useState } from "react";

/**
 * Loads data whenever `deps` change. Keeps the previous result on screen while
 * the next request is in flight, so filters don't flash a loading state.
 */
export function useData<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    let live = true;
    setPending(true);
    setError(null);
    load()
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => live && setPending(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, pending };
}
