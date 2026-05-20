import { useEffect, useState } from 'react';

export function useTicker(intervalMs = 1000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setN((n) => (n + 1) % 1_000_000), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}
