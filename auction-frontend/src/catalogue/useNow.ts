import { useEffect, useState } from 'react';

/**
 * useNow
 *
 * Returns the current time in milliseconds and refreshes it every second,
 * so countdowns on the page stay up to date.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
}