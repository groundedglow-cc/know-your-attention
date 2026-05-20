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
