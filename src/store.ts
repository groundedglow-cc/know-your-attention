import { useCallback, useEffect, useRef, useState } from 'react';
import type { Status, SubTask, Task } from './types';
import { uid } from './utils/time';

const STORAGE_KEY = 'kya.tasks';

function load(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Task[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function save(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* ignore quota */
  }
}

function settleRunning<T extends { status: Status; accumulatedMs: number; startedAt?: number }>(
  t: T,
): T {
  if (t.status === 'running' && t.startedAt) {
    return {
      ...t,
      status: 'paused',
      accumulatedMs: t.accumulatedMs + (Date.now() - t.startedAt),
      startedAt: undefined,
    };
  }
  return t;
}

function pauseAll(tasks: Task[]): Task[] {
  return tasks.map((t) => ({
    ...settleRunning(t),
    children: t.children.map(settleRunning),
  }));
}

export function sortTasks(tasks: Task[]): Task[] {
  const pinned = tasks
    .filter((t) => t.pinned)
    .sort((a, b) => (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0));
  const normal = tasks
    .filter((t) => !t.pinned)
    .sort((a, b) => a.createdAt - b.createdAt);
  return [...pinned, ...normal];
}

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(() => load());
  const ref = useRef(tasks);
  ref.current = tasks;

  useEffect(() => {
    save(tasks);
  }, [tasks]);

  const addTask = useCallback((emoji: string, text: string) => {
    const t: Task = {
      id: uid(),
      emoji: emoji || '📝',
      text: text.trim(),
      status: 'todo',
      accumulatedMs: 0,
      pinned: false,
      expanded: true,
      children: [],
      createdAt: Date.now(),
    };
    setTasks((prev) => [...prev, t]);
    return t.id;
  }, []);

  const addSubTask = useCallback((parentId: string, text: string) => {
    const sub: SubTask = {
      id: uid(),
      text: text.trim(),
      status: 'todo',
      accumulatedMs: 0,
      createdAt: Date.now(),
    };
    setTasks((prev) =>
      prev.map((t) =>
        t.id === parentId
          ? { ...t, children: [...t.children, sub], expanded: true }
          : t,
      ),
    );
    return sub.id;
  }, []);

  const toggleStatus = useCallback((path: { taskId: string; subId?: string }) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === path.taskId);
      if (!target) return prev;
      const cur: Status = path.subId
        ? target.children.find((s) => s.id === path.subId)?.status ?? 'todo'
        : target.status;
      // 状态轮转：todo -> running -> paused -> running
      const next: Status = cur === 'running' ? 'paused' : 'running';

      let working = prev;
      if (next === 'running') {
        working = pauseAll(working);
      }
      return working.map((t) => {
        if (t.id !== path.taskId) return t;
        if (path.subId) {
          return {
            ...t,
            children: t.children.map((s) =>
              s.id === path.subId
                ? next === 'running'
                  ? { ...s, status: 'running', startedAt: Date.now() }
                  : { ...settleRunning(s) }
                : s,
            ),
          };
        }
        return next === 'running'
          ? { ...t, status: 'running', startedAt: Date.now() }
          : { ...settleRunning(t) };
      });
    });
  }, []);

  const markDone = useCallback((path: { taskId: string; subId?: string }) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== path.taskId) return t;
        if (path.subId) {
          return {
            ...t,
            children: t.children.map((s) =>
              s.id === path.subId
                ? { ...settleRunning(s), status: 'done', startedAt: undefined }
                : s,
            ),
          };
        }
        return { ...settleRunning(t), status: 'done', startedAt: undefined };
      }),
    );
  }, []);

  const togglePin = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, pinned: !t.pinned, pinnedAt: !t.pinned ? Date.now() : undefined }
          : t,
      ),
    );
  }, []);

  const setExpanded = useCallback((taskId: string, expanded: boolean) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, expanded } : t)),
    );
  }, []);

  const updateText = useCallback(
    (path: { taskId: string; subId?: string }, text: string) => {
      const v = text.trim();
      if (!v) return;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== path.taskId) return t;
          if (path.subId) {
            return {
              ...t,
              children: t.children.map((s) =>
                s.id === path.subId ? { ...s, text: v } : s,
              ),
            };
          }
          return { ...t, text: v };
        }),
      );
    },
    [],
  );

  const updateEmoji = useCallback((taskId: string, emoji: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, emoji } : t)),
    );
  }, []);

  const removeTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const removeSub = useCallback((taskId: string, subId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, children: t.children.filter((s) => s.id !== subId) } : t,
      ),
    );
  }, []);

  return {
    tasks,
    sorted: sortTasks(tasks),
    addTask,
    addSubTask,
    toggleStatus,
    markDone,
    togglePin,
    setExpanded,
    updateText,
    updateEmoji,
    removeTask,
    removeSub,
  };
}

export type Store = ReturnType<typeof useTaskStore>;
