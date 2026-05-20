import type { Status } from '../types';

interface Props {
  status: Status;
  onClick?: () => void;
}

export function StatusIcon({ status, onClick }: Props) {
  const map: Record<Status, { ch: string; cls: string; title: string }> = {
    todo: { ch: '○', cls: 'st-todo', title: '未开始' },
    running: { ch: '▶', cls: 'st-running', title: '进行中' },
    paused: { ch: '⏸', cls: 'st-paused', title: '暂停中' },
    done: { ch: '✓', cls: 'st-done', title: '已完成' },
  };
  const cur = map[status];
  return (
    <button
      type="button"
      className={`st ${cur.cls}`}
      title={cur.title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {cur.ch}
    </button>
  );
}
