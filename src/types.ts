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
}

export type SelectedPath =
  | { kind: 'task'; taskId: string }
  | { kind: 'sub'; taskId: string; subId: string }
  | null;
