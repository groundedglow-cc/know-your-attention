export type Status = 'todo' | 'running' | 'paused' | 'done';

export interface SubTask {
  id: string;
  text: string;
  status: Status;
  accumulatedMs: number;
  startedAt?: number;
  createdAt: number;
}

export interface Task {
  id: string;
  emoji: string;
  text: string;
  status: Status;
  accumulatedMs: number;
  startedAt?: number;
  pinned: boolean;
  pinnedAt?: number;
  expanded: boolean;
  children: SubTask[];
  createdAt: number;
  // 任务归属日期（YYYY-MM-DD，本地时区）。搬运到新一天时直接改这个字段。
  dateKey: string;
  // 可选：第一次创建时的归属日期，搬运后保留，便于追溯。
  carriedFrom?: string;
}

export type SelectedPath =
  | { kind: 'task'; taskId: string }
  | { kind: 'sub'; taskId: string; subId: string }
  | null;
