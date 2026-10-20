import { useCallback, useEffect, useRef, useState } from 'react';

const KEY = 'kya.taskNotes';

type Map = Record<string, string>;

function load(): Map {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return p && typeof p === 'object' && !Array.isArray(p) ? (p as Map) : {};
  } catch {
    return {};
  }
}

function save(m: Map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

export function useTaskNotes() {
  const [map, setMap] = useState<Map>(() => load());
  const timerRef = useRef<number | null>(null);

  // 写操作 debounce 400ms
  useEffect(() => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => save(map), 400);
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [map]);

  // 关闭页面前 flush
  useEffect(() => {
    const flush = () => save(map);
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [map]);

  const get = useCallback((k: string) => map[k] ?? '', [map]);
  const set = useCallback((k: string, v: string) => {
    setMap((prev) => ({ ...prev, [k]: v }));
  }, []);

  return { get, set };
}
