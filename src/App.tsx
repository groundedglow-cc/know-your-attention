import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { TaskInput } from './components/TaskInput';
import { TaskItem } from './components/TaskItem';
import { SubTaskItem } from './components/SubTaskItem';
import { Tabs, type TabKey } from './components/Tabs';
import { NotesView } from './components/NotesView';
import { NotePanel } from './components/NotePanel';
import { DateNav } from './components/DateNav';
import { useTaskNotes } from './taskNotesStore';
import { useTaskStore } from './store';
import { useTicker } from './hooks/useTicker';
import { ShortcutHelp } from './components/ShortcutHelp';
import { shiftDateKey, todayKey } from './utils/time';
import type { SelectedPath } from './types';
import './App.css';

type Adding = null | { kind: 'top' } | { kind: 'sub'; taskId: string };
type Editing = null | { taskId: string; subId?: string };
const TAB_ORDER: TabKey[] = ['tasks', 'notes'];

function isInInput(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  if (el.closest && el.closest('[data-task-input="true"]')) return true;
  return false;
}

const SHOW_DONE_KEY = 'kya:show-done';
function loadShowDone(): boolean {
  try {
    return localStorage.getItem(SHOW_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

const PEEK_KEY = 'kya:peek-opacity';
function loadPeek(): number {
  try {
    const raw = localStorage.getItem(PEEK_KEY);
    if (raw == null) return 100;
    const n = parseInt(raw, 10);
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, n));
  } catch { /* ignore */ }
  return 100;
}

export default function App() {
  useTicker(1000);
  const store = useTaskStore();
  const taskNotes = useTaskNotes();
  const [peekOpacity, setPeekOpacity] = useState<number>(() => loadPeek());
  const [showDone, setShowDone] = useState<boolean>(() => loadShowDone());
  const [windowFocused, setWindowFocused] = useState<boolean>(() =>
    typeof document === 'undefined' ? true : document.hasFocus(),
  );
  const [tab, setTab] = useState<TabKey>('tasks');
  const [selectedDate, setSelectedDate] = useState<string>(() => todayKey());
  const [selected, setSelected] = useState<SelectedPath>(null);
  const [adding, setAdding] = useState<Adding>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [addingNote, setAddingNote] = useState(false);

  // 拖拽状态：dropKey 形如 't:id' / 's:parentId/subId'，用于显示蓝色指示线
  const [dropHint, setDropHint] = useState<
    { key: string; pos: 'before' | 'after' } | null
  >(null);

  function computeDropPos(e: React.DragEvent<HTMLDivElement>): 'before' | 'after' {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
  }

  useEffect(() => {
    try {
      localStorage.setItem(PEEK_KEY, String(peekOpacity));
    } catch { /* ignore */ }
  }, [peekOpacity]);

  useEffect(() => {
    try {
      localStorage.setItem(SHOW_DONE_KEY, showDone ? '1' : '0');
    } catch { /* ignore */ }
  }, [showDone]);

  useEffect(() => {
    const onFocus = () => setWindowFocused(true);
    const onBlur = () => setWindowFocused(false);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const dim = !windowFocused && peekOpacity < 100;

  const visibleTasks = useMemo(() => {
    const ofDate = store.sorted.filter((t) => t.dateKey === selectedDate);
    if (showDone) return ofDate;
    return ofDate
      .filter((t) => t.status !== 'done')
      .map((t) => ({
        ...t,
        children: t.children.filter((s) => s.status !== 'done'),
      }));
  }, [store.sorted, showDone, selectedDate]);

  const doneTaskCount = useMemo(
    () =>
      store.sorted.filter(
        (t) => t.dateKey === selectedDate && t.status === 'done',
      ).length,
    [store.sorted, selectedDate],
  );

  const dateTaskCount = useMemo(
    () => store.sorted.filter((t) => t.dateKey === selectedDate).length,
    [store.sorted, selectedDate],
  );

  // 比当前日期更早、且仍未完成的任务，可一键搬到当前日期。
  const carriableTasks = useMemo(
    () =>
      store.sorted.filter(
        (t) => t.dateKey < selectedDate && t.status !== 'done',
      ),
    [store.sorted, selectedDate],
  );

  const flat = useMemo(() => {
    const arr: SelectedPath[] = [];
    for (const t of visibleTasks) {
      arr.push({ kind: 'task', taskId: t.id });
      if (t.expanded) {
        for (const s of t.children) {
          arr.push({ kind: 'sub', taskId: t.id, subId: s.id });
        }
      }
    }
    return arr;
  }, [visibleTasks]);

  useEffect(() => {
    if (!selected) return;
    const exists = flat.some(
      (p) =>
        p &&
        p.kind === selected.kind &&
        p.taskId === selected.taskId &&
        (p.kind === 'sub' ? p.subId === (selected as any).subId : true),
    );
    if (!exists) setSelected(null);
  }, [flat, selected]);

  const moveSel = useCallback(
    (dir: 1 | -1) => {
      if (flat.length === 0) return;
      if (!selected) {
        setSelected(dir === 1 ? flat[0] : flat[flat.length - 1]);
        return;
      }
      const idx = flat.findIndex(
        (p) =>
          !!p &&
          p.kind === selected.kind &&
          p.taskId === selected.taskId &&
          (p.kind === 'sub' ? p.subId === (selected as any).subId : true),
      );
      const n = flat.length;
      const next = ((idx + dir) % n + n) % n;
      setSelected(flat[next]);
    },
    [flat, selected],
  );

  const numberTargets = useMemo<SelectedPath[]>(() => {
    if (selected && selected.kind === 'sub') {
      const parent = visibleTasks.find((t) => t.id === selected.taskId);
      if (!parent) return [];
      return parent.children
        .slice(0, 9)
        .map((s) => ({ kind: 'sub' as const, taskId: parent.id, subId: s.id }));
    }
    return visibleTasks
      .slice(0, 9)
      .map((t) => ({ kind: 'task' as const, taskId: t.id }));
  }, [visibleTasks, selected]);

  const startAddTop = useCallback(() => {
    if (tab === 'notes') setAddingNote(true);
    else setAdding({ kind: 'top' });
  }, [tab]);

  // 切换 tab 工具
  const switchTab = useCallback((dir: 1 | -1) => {
    setTab((cur) => {
      const i = TAB_ORDER.indexOf(cur);
      const nx = (i + dir + TAB_ORDER.length) % TAB_ORDER.length;
      return TAB_ORDER[nx];
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isInInput(e.target)) return;
      // 任何修饰键（Cmd/Ctrl/Alt）都让浏览器接管，避免与系统/浏览器键冲突
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // [ / ] 切换 Tab
      if (e.key === '[') {
        e.preventDefault();
        switchTab(-1);
        return;
      }
      if (e.key === ']') {
        e.preventDefault();
        switchTab(1);
        return;
      }

      // Shift+N 强制新增父项 / 顶层
      if (e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        if (tab === 'notes') setAddingNote(true);
        else setAdding({ kind: 'top' });
        return;
      }

      // N 上下文新增（选中父项 → 子项；否则顶层）
      if (!e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (tab === 'notes') {
          setAddingNote(true);
        } else if (selected) {
          setAdding({ kind: 'sub', taskId: selected.taskId });
        } else {
          setAdding({ kind: 'top' });
        }
        return;
      }

      // 以下仅在事项 tab 生效
      if (tab !== 'tasks') return;

      // T 回到今天
      if (!e.shiftKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        setSelectedDate(todayKey());
        return;
      }
      // , 前一天 / . 后一天
      if (!e.shiftKey && e.key === ',') {
        e.preventDefault();
        setSelectedDate((d) => shiftDateKey(d, -1));
        return;
      }
      if (!e.shiftKey && e.key === '.') {
        e.preventDefault();
        setSelectedDate((d) => shiftDateKey(d, 1));
        return;
      }

      // H 切换显示/隐藏已完成
      if (!e.shiftKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setShowDone((v) => !v);
        return;
      }

      // 1~9 跳转到第 N 项
      if (!e.shiftKey) {
        const m = /^Digit([1-9])$/.exec(e.code);
        if (m) {
          const i = parseInt(m[1], 10) - 1;
          const target = numberTargets[i];
          if (target) {
            e.preventDefault();
            setSelected(target);
          }
          return;
        }
      }

      // Space 切换进行/暂停
      if (!e.shiftKey && (e.key === ' ' || e.code === 'Space')) {
        if (selected) {
          e.preventDefault();
          if (selected.kind === 'task') {
            store.toggleStatus({ taskId: selected.taskId });
          } else {
            store.toggleStatus({ taskId: selected.taskId, subId: selected.subId });
          }
        }
        return;
      }

      // X 标记完成
      if (!e.shiftKey && (e.key === 'x' || e.key === 'X')) {
        if (selected) {
          e.preventDefault();
          if (selected.kind === 'task') {
            store.markDone({ taskId: selected.taskId });
          } else {
            store.markDone({ taskId: selected.taskId, subId: selected.subId });
          }
        }
        return;
      }

      // Shift + ← / → 跳父级 / 跳第一个子项
      if (e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        const parents = visibleTasks;
        if (parents.length === 0) return;
        if (!selected) {
          setSelected({ kind: 'task', taskId: parents[parents.length - 1].id });
          return;
        }
        if (selected.kind === 'sub') {
          setSelected({ kind: 'task', taskId: selected.taskId });
        } else {
          const idx = parents.findIndex((p) => p.id === selected.taskId);
          const next = (idx - 1 + parents.length) % parents.length;
          setSelected({ kind: 'task', taskId: parents[next].id });
        }
        return;
      }
      if (e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (!selected) return;
        if (selected.kind === 'task') {
          const t = visibleTasks.find((p) => p.id === selected.taskId);
          if (t && t.children.length > 0) {
            if (!t.expanded) store.setExpanded(t.id, true);
            setSelected({ kind: 'sub', taskId: t.id, subId: t.children[0].id });
          }
        }
        return;
      }

      // ← 收起 / → 展开
      if (!e.shiftKey && e.key === 'ArrowLeft') {
        if (selected && selected.kind === 'task') {
          e.preventDefault();
          store.setExpanded(selected.taskId, false);
        }
        return;
      }
      if (!e.shiftKey && e.key === 'ArrowRight') {
        if (selected && selected.kind === 'task') {
          e.preventDefault();
          store.setExpanded(selected.taskId, true);
        }
        return;
      }

      // ↑ / ↓ 上下移动选中
      if (!e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault();
        moveSel(1);
        return;
      }
      if (!e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault();
        moveSel(-1);
        return;
      }

      // Enter 进入编辑模式
      if (!e.shiftKey && e.key === 'Enter' && selected) {
        e.preventDefault();
        setEditing(
          selected.kind === 'sub'
            ? { taskId: selected.taskId, subId: selected.subId }
            : { taskId: selected.taskId },
        );
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [selected, store, moveSel, numberTargets, tab, switchTab, visibleTasks]);

  const submitAdd = (text: string, emoji: string) => {
    if (!adding) return;
    const hasRunning = store.tasks.some(
      (t) =>
        t.status === 'running' || t.children.some((s) => s.status === 'running'),
    );
    const startNew = (path: { taskId: string; subId?: string }) => {
      if (!hasRunning) {
        store.toggleStatus(path);
        return;
      }
      const ok = window.confirm(
        '当前已有事项正在进行中，是否切换到新事项？',
      );
      if (ok) store.toggleStatus(path);
    };
    if (adding.kind === 'top') {
      const id = store.addTask(emoji, text, selectedDate);
      setSelected({ kind: 'task', taskId: id });
      startNew({ taskId: id });
    } else {
      const subId = store.addSubTask(adding.taskId, text);
      setSelected({ kind: 'sub', taskId: adding.taskId, subId });
      startNew({ taskId: adding.taskId, subId });
    }
    setAdding(null);
  };

  const numberBadgeMap = useMemo(() => {
    const m = new Map<string, number>();
    if (tab !== 'tasks') return m;
    numberTargets.forEach((p, i) => {
      if (!p) return;
      const k = p.kind === 'sub' ? `s:${p.subId}` : `t:${p.taskId}`;
      m.set(k, i + 1);
    });
    return m;
  }, [numberTargets, tab]);

  // 区分置顶与非置顶位置（用于插入 divider）
  const firstUnpinnedIdx = visibleTasks.findIndex((t) => !t.pinned);
  const hasPinned = visibleTasks.some((t) => t.pinned);
  const hasUnpinned = firstUnpinnedIdx !== -1;
  const showDivider = hasPinned && hasUnpinned;

  const noteKey = selected
    ? selected.kind === 'task'
      ? `t:${selected.taskId}`
      : `s:${selected.taskId}/${selected.subId}`
    : null;

  return (
    <div
      className={'app-shell' + (dim ? ' dim' : '')}
      style={{ ['--peek-opacity' as any]: peekOpacity / 100 }}
    >
      <div className="app">
      <Header
        onAdd={startAddTop}
        peekOpacity={peekOpacity}
        onPeekChange={setPeekOpacity}
        showDone={showDone}
        onToggleShowDone={() => setShowDone((v) => !v)}
        center={
          tab === 'tasks' ? (
            <DateNav
              dateKey={selectedDate}
              onChange={setSelectedDate}
            />
          ) : null
        }
      />
      <Tabs active={tab} onChange={setTab} />
      <div className="content">
        {tab === 'tasks' ? (
          <>
            {adding?.kind === 'top' && (
              <TaskInput
                showEmoji
                onSubmit={submitAdd}
                onCancel={() => setAdding(null)}
              />
            )}
            {carriableTasks.length > 0 && (
              <div className="carry-bar">
                <span className="carry-bar-text">
                  早些时候有 {carriableTasks.length} 个未完成事项
                </span>
                <span className="carry-bar-actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={() =>
                      store.carryForward(
                        carriableTasks.map((t) => t.id),
                        selectedDate,
                      )
                    }
                    title="把全部未完成搬到当前日期"
                  >
                    全部搬过来
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() =>
                      setSelectedDate(carriableTasks[carriableTasks.length - 1].dateKey)
                    }
                    title="跳到最近一个有未完成事项的日期"
                  >
                    去看看
                  </button>
                </span>
              </div>
            )}
            <div className="task-toolbar">
              <label
                className="switch-row"
                title="切换显示已完成 (H)"
              >
                <span className="switch-label">
                  显示已完成
                  {doneTaskCount > 0 && (
                    <span className="switch-count">{doneTaskCount}</span>
                  )}
                </span>
                <span
                  className={'switch' + (showDone ? ' on' : '')}
                  role="switch"
                  aria-checked={showDone}
                  tabIndex={0}
                  onClick={() => setShowDone((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setShowDone((v) => !v);
                    }
                  }}
                >
                  <span className="switch-thumb" />
                </span>
              </label>
            </div>
            {visibleTasks.length === 0 && !adding && (
              <div className="empty">
                {dateTaskCount === 0
                  ? `${selectedDate === todayKey() ? '今天' : selectedDate} 还没有事项。点 ＋ 或按 N 添加`
                  : '当前日期没有进行中的事项。按 H 显示已完成'}
              </div>
            )}
            {visibleTasks.map((t, idx) => {
              const taskSelected =
                !!selected && selected.kind === 'task' && selected.taskId === t.id;
              const isEditingTask =
                !!editing && editing.taskId === t.id && !editing.subId;
              const badge = numberBadgeMap.get(`t:${t.id}`);
              const taskKey = `t:${t.id}`;
              const taskCanDrag = !isEditingTask;
              return (
                <div key={t.id}>
                  {showDivider && idx === firstUnpinnedIdx && (
                    <div className="divider">
                      <span>其他事项</span>
                    </div>
                  )}
                  <div
                    className={
                      'drag-row' +
                      (dropHint?.key === taskKey
                        ? dropHint.pos === 'before'
                          ? ' drop-before'
                          : ' drop-after'
                        : '')
                    }
                    draggable={taskCanDrag}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData(
                        'application/x-kya',
                        JSON.stringify({ kind: 'task', id: t.id, pinned: t.pinned }),
                      );
                    }}
                    onDragOver={(e) => {
                      const raw = e.dataTransfer.types.includes('application/x-kya');
                      if (!raw) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      const pos = computeDropPos(e);
                      setDropHint({ key: taskKey, pos });
                    }}
                    onDragLeave={() => {
                      setDropHint((h) => (h?.key === taskKey ? null : h));
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const raw = e.dataTransfer.getData('application/x-kya');
                      setDropHint(null);
                      if (!raw) return;
                      const data = JSON.parse(raw) as {
                        kind: 'task' | 'sub';
                        id: string;
                        pinned?: boolean;
                      };
                      if (data.kind !== 'task') return;
                      if (data.pinned !== t.pinned) return; // 不允许跨 pinned 组
                      store.reorderTask(data.id, t.id, computeDropPos(e));
                    }}
                  >
                    <TaskItem
                      task={t}
                      selected={taskSelected}
                      badge={badge}
                      editing={isEditingTask}
                      onSelect={() => setSelected({ kind: 'task', taskId: t.id })}
                      onEditStart={() => {
                        setSelected({ kind: 'task', taskId: t.id });
                        setEditing({ taskId: t.id });
                      }}
                      onEditCommit={(text) => {
                        store.updateText({ taskId: t.id }, text);
                        setEditing(null);
                      }}
                      onEditCancel={() => setEditing(null)}
                      onEditEmoji={(em) => store.updateEmoji(t.id, em)}
                      onToggleStatus={() => store.toggleStatus({ taskId: t.id })}
                      onTogglePin={() => store.togglePin(t.id)}
                      onToggleExpand={() => store.setExpanded(t.id, !t.expanded)}
                    />
                  </div>
                  {t.expanded &&
                    t.children.map((s) => {
                      const subSelected =
                        !!selected &&
                        selected.kind === 'sub' &&
                        selected.taskId === t.id &&
                        selected.subId === s.id;
                      const isEditingSub =
                        !!editing &&
                        editing.taskId === t.id &&
                        editing.subId === s.id;
                      const sBadge = numberBadgeMap.get(`s:${s.id}`);
                      const subKey = `s:${t.id}/${s.id}`;
                      const subCanDrag = !isEditingSub;
                      return (
                        <div
                          key={s.id}
                          className={
                            'drag-row' +
                            (dropHint?.key === subKey
                              ? dropHint.pos === 'before'
                                ? ' drop-before'
                                : ' drop-after'
                              : '')
                          }
                          draggable={subCanDrag}
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData(
                              'application/x-kya',
                              JSON.stringify({
                                kind: 'sub',
                                id: s.id,
                                parentId: t.id,
                              }),
                            );
                          }}
                          onDragOver={(e) => {
                            const raw =
                              e.dataTransfer.types.includes('application/x-kya');
                            if (!raw) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDropHint({ key: subKey, pos: computeDropPos(e) });
                          }}
                          onDragLeave={() => {
                            setDropHint((h) => (h?.key === subKey ? null : h));
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const raw =
                              e.dataTransfer.getData('application/x-kya');
                            setDropHint(null);
                            if (!raw) return;
                            const data = JSON.parse(raw) as {
                              kind: 'task' | 'sub';
                              id: string;
                              parentId?: string;
                            };
                            if (data.kind !== 'sub') return;
                            if (data.parentId !== t.id) return; // 不允许跨父任务
                            store.reorderSub(t.id, data.id, s.id, computeDropPos(e));
                          }}
                        >
                          <SubTaskItem
                            sub={s}
                            selected={subSelected}
                            badge={sBadge}
                            editing={isEditingSub}
                            onSelect={() =>
                              setSelected({ kind: 'sub', taskId: t.id, subId: s.id })
                            }
                            onEditStart={() => {
                              setSelected({
                                kind: 'sub',
                                taskId: t.id,
                                subId: s.id,
                              });
                              setEditing({ taskId: t.id, subId: s.id });
                            }}
                            onEditCommit={(text) => {
                              store.updateText({ taskId: t.id, subId: s.id }, text);
                              setEditing(null);
                            }}
                            onEditCancel={() => setEditing(null)}
                            onToggleStatus={() =>
                              store.toggleStatus({ taskId: t.id, subId: s.id })
                            }
                          />
                        </div>
                      );
                    })}
                  {adding?.kind === 'sub' && adding.taskId === t.id && (
                    <div className="sub-input-wrap">
                      <TaskInput
                        showEmoji={false}
                        placeholder="输入子项，Cmd+Enter 完成"
                        onSubmit={submitAdd}
                        onCancel={() => setAdding(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <NotesView
            adding={addingNote}
            onCancelAdd={() => setAddingNote(false)}
          />
        )}
      </div>
      </div>
      <NotePanel
        noteKey={noteKey}
        text={noteKey ? taskNotes.get(noteKey) : ''}
        onChange={(v) => noteKey && taskNotes.set(noteKey, v)}
      />
      <ShortcutHelp />
    </div>
  );
}
