import type { Status } from '../types';

export function liveMs(t: { accumulatedMs: number; status: Status; startedAt?: number }): number {
  if (t.status === 'running' && t.startedAt) {
    return t.accumulatedMs + (Date.now() - t.startedAt);
  }
  return t.accumulatedMs;
}

export function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// === 日期分区 ===

export function toDateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(Date.now());
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map((s) => parseInt(s, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

export function shiftDateKey(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d.getTime());
}

const WEEK_LABEL = ['日', '一', '二', '三', '四', '五', '六'];

export function formatDateLabel(key: string): string {
  const today = todayKey();
  if (key === today) return '今天';
  if (key === shiftDateKey(today, -1)) return '昨天';
  if (key === shiftDateKey(today, 1)) return '明天';
  const d = parseDateKey(key);
  return `${d.getMonth() + 1}月${d.getDate()}日 周${WEEK_LABEL[d.getDay()]}`;
}
