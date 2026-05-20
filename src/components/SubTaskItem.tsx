import type { SubTask } from '../types';
import { StatusIcon } from './StatusIcon';
import { fmt, liveMs } from '../utils/time';
import { InlineEdit } from './InlineEdit';

interface Props {
  sub: SubTask;
  selected: boolean;
  badge?: number;
  editing: boolean;
  holdPct?: number;
  onSelect: () => void;
  onEditStart: () => void;
  onEditCommit: (text: string) => void;
  onEditCancel: () => void;
  onToggleStatus: () => void;
}

export function SubTaskItem({
  sub,
  selected,
  badge,
  editing,
  holdPct,
  onSelect,
  onEditStart,
  onEditCommit,
  onEditCancel,
  onToggleStatus,
}: Props) {
  return (
    <div
      className={`item sub ${selected ? 'selected' : ''} ${sub.status === 'done' ? 'done' : ''}`}
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEditStart();
      }}
    >
      {holdPct !== undefined && (
        <span
          className="hold-bar"
          style={{ width: `${Math.round(holdPct * 100)}%` }}
        />
      )}
      {badge !== undefined && <span className="badge">{badge}</span>}
      <StatusIcon status={sub.status} onClick={onToggleStatus} />
      {editing ? (
        <InlineEdit
          initial={sub.text}
          onSubmit={onEditCommit}
          onCancel={onEditCancel}
        />
      ) : (
        <span className="text">{sub.text}</span>
      )}
      <span className={'dur' + (sub.status === 'running' ? ' running' : '')}>
        {fmt(liveMs(sub))}
      </span>
    </div>
  );
}
