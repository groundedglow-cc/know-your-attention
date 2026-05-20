import type { Task } from '../types';
import type { Note } from '../notesStore';
import { fmt, liveMs } from './time';

const KEYS = {
  tasks: 'kya.tasks',
  notes: 'kya.notes',
  taskNotes: 'kya.taskNotes',
} as const;

interface Snapshot {
  version: number;
  exportedAt: string;
  tasks: Task[];
  notes: Note[];
  taskNotes: Record<string, string>;
}

function safeRead<T>(k: string, fb: T): T {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return fb;
    const p = JSON.parse(raw);
    return p ?? fb;
  } catch {
    return fb;
  }
}

function readAll(): Snapshot {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: safeRead<Task[]>(KEYS.tasks, []),
    notes: safeRead<Note[]>(KEYS.notes, []),
    taskNotes: safeRead<Record<string, string>>(KEYS.taskNotes, {}),
  };
}

function todayLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface FileSystemWritable {
  write: (data: BlobPart) => Promise<void>;
  close: () => Promise<void>;
}
interface FileSystemFileHandle {
  createWritable: () => Promise<FileSystemWritable>;
}
interface FileSystemDirectoryHandle {
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<FileSystemFileHandle>;
}

async function saveToDirectory(
  name: string,
  content: string,
  mime: string,
): Promise<'ok' | 'cancel' | 'unsupported'> {
  const w = window as unknown as {
    showDirectoryPicker?: (opts?: {
      mode?: 'read' | 'readwrite';
    }) => Promise<FileSystemDirectoryHandle>;
  };
  if (typeof w.showDirectoryPicker !== 'function') return 'unsupported';
  try {
    const dir = await w.showDirectoryPicker({ mode: 'readwrite' });
    const file = await dir.getFileHandle(name, { create: true });
    const writable = await file.createWritable();
    await writable.write(new Blob([content], { type: mime }));
    await writable.close();
    return 'ok';
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancel';
    throw e;
  }
}

function fallbackDownload(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function download(name: string, content: string, mime: string) {
  try {
    const r = await saveToDirectory(name, content, mime);
    if (r === 'unsupported') {
      fallbackDownload(name, content, mime);
    }
    // ok / cancel: 都不再触发额外下载
  } catch (e) {
    console.error('[export] save to directory failed, fallback to download:', e);
    fallbackDownload(name, content, mime);
  }
}

const STATUS_ICON: Record<string, string> = {
  todo: '⚪',
  running: '▶',
  paused: '⏸',
  done: '✓',
};

export async function exportJson() {
  const snap = readAll();
  await download(
    `${todayLabel()} My Attention.json`,
    JSON.stringify(snap, null, 2),
    'application/json',
  );
}

export async function exportMarkdown() {
  const snap = readAll();
  const out: string[] = [];
  out.push(`# ${todayLabel()} My Attention`, '');

  out.push('## 事项', '');
  if (snap.tasks.length === 0) {
    out.push('_暂无事项_', '');
  } else {
    const pinned = snap.tasks
      .filter((t) => t.pinned)
      .sort((a, b) => (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0));
    const normal = snap.tasks
      .filter((t) => !t.pinned)
      .sort((a, b) => a.createdAt - b.createdAt);
    const all = [...pinned, ...normal];
    for (const t of all) {
      const icon = STATUS_ICON[t.status] ?? '';
      const pin = t.pinned ? ' 📌' : '';
      const total =
        liveMs(t) + t.children.reduce((acc, s) => acc + liveMs(s), 0);
      out.push(`- ${icon} ${t.emoji} ${t.text}${pin} — \`${fmt(total)}\``);
      const tn = snap.taskNotes[`t:${t.id}`];
      if (tn && tn.trim()) {
        for (const line of tn.split('\n')) out.push(`  > ${line}`);
      }
      for (const s of t.children) {
        out.push(
          `  - ${STATUS_ICON[s.status] ?? ''} ${s.text} — \`${fmt(liveMs(s))}\``,
        );
        const sn = snap.taskNotes[`s:${t.id}/${s.id}`];
        if (sn && sn.trim()) {
          for (const line of sn.split('\n')) out.push(`    > ${line}`);
        }
      }
    }
    out.push('');
  }

  out.push('## 随手记', '');
  if (snap.notes.length === 0) {
    out.push('_暂无_', '');
  } else {
    for (const n of snap.notes) {
      const d = new Date(n.createdAt);
      const ts = `${d.getMonth() + 1}/${d.getDate()} ${String(
        d.getHours(),
      ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      out.push(`- \`${ts}\` ${n.text.replace(/\n/g, ' ')}`);
    }
    out.push('');
  }

  await download(
    `${todayLabel()} My Attention.md`,
    out.join('\n'),
    'text/markdown;charset=utf-8',
  );
}

export async function importJsonFile(
  file: File,
): Promise<{ ok: boolean; error?: string; counts?: { tasks: number; notes: number; taskNotes: number } }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as Partial<Snapshot>;
    if (!data || typeof data !== 'object') throw new Error('数据格式错误');

    const cur = readAll();
    const incTasks = Array.isArray(data.tasks) ? (data.tasks as Task[]) : [];
    const incNotes = Array.isArray(data.notes) ? (data.notes as Note[]) : [];
    const incTaskNotes =
      data.taskNotes && typeof data.taskNotes === 'object'
        ? (data.taskNotes as Record<string, string>)
        : {};

    const existIds = new Set(cur.tasks.map((t) => t.id));
    const dedupedTasks = incTasks.filter((t) => !existIds.has(t.id));
    const existNoteIds = new Set(cur.notes.map((n) => n.id));
    const dedupedNotes = incNotes.filter((n) => !existNoteIds.has(n.id));

    const tasks = [...cur.tasks, ...dedupedTasks];
    const notes = [...cur.notes, ...dedupedNotes];
    // 现有内容优先，避免覆盖近期编辑
    const taskNotes = { ...incTaskNotes, ...cur.taskNotes };

    localStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
    localStorage.setItem(KEYS.notes, JSON.stringify(notes));
    localStorage.setItem(KEYS.taskNotes, JSON.stringify(taskNotes));
    return {
      ok: true,
      counts: {
        tasks: dedupedTasks.length,
        notes: dedupedNotes.length,
        taskNotes: Object.keys(incTaskNotes).filter(
          (k) => !(k in cur.taskNotes),
        ).length,
      },
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '导入失败';
    return { ok: false, error: msg };
  }
}

export function resetAll() {
  for (const k of Object.values(KEYS)) localStorage.removeItem(k);
}
