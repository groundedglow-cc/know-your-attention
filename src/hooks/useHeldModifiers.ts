import { useEffect, useState } from 'react';
import type { Modifier } from '../shortcuts';

export function useHeldModifiers(): Set<Modifier> {
  const [held, setHeld] = useState<Set<Modifier>>(new Set());
  useEffect(() => {
    const compute = (e: KeyboardEvent) => {
      const next = new Set<Modifier>();
      if (e.shiftKey) next.add('shift');
      if (e.metaKey) next.add('meta');
      if (e.altKey) next.add('alt');
      if (e.ctrlKey) next.add('ctrl');
      setHeld((prev) => {
        if (prev.size === next.size && [...prev].every((m) => next.has(m))) {
          return prev;
        }
        return next;
      });
    };
    const blur = () => setHeld(new Set());
    window.addEventListener('keydown', compute);
    window.addEventListener('keyup', compute);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', compute);
      window.removeEventListener('keyup', compute);
      window.removeEventListener('blur', blur);
    };
  }, []);
  return held;
}
