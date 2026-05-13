'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * A hook that runs a callback on an interval, but pauses when the tab is not visible.
 * This prevents unnecessary network requests when the user isn't looking at the page.
 */
export function useVisibleInterval(callback: () => void, intervalMs: number) {
  const savedCallback = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => savedCallback.current(), intervalMs);
  }, [intervalMs]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Start immediately if visible
    if (!document.hidden) {
      start();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        // Refresh immediately when tab becomes visible, then restart interval
        savedCallback.current();
        start();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [start, stop]);
}
