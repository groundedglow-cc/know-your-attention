import { useCallback, useEffect, useState } from 'react';
import { uid } from './utils/time';

const KEY = 'kya.notes';

export interface Note {
  id: string;
  text: string;
  createdAt: number;
}

function load(): Note[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Note[]) : [];
  } catch {
    return [];
  }
}

function save(notes: Note[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    /* ignore */
  }
}

export function useNotesStore() {
  const [notes, setNotes] = useState<Note[]>(() => load());

  useEffect(() => {
    save(notes);
  }, [notes]);

  const add = useCallback((text: string) => {
    const v = text.trim();
    if (!v) return;
    const n: Note = { id: uid(), text: v, createdAt: Date.now() };
    setNotes((prev) => [n, ...prev]);
  }, []);

  const update = useCallback((id: string, text: string) => {
    const v = text.trim();
    if (!v) return;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text: v } : n)));
  }, []);

  const remove = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notes, add, update, remove };
}
