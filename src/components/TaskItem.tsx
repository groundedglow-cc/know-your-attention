import { useState } from 'react';
import type { Task } from '../types';
import { StatusIcon } from './StatusIcon';
import { fmt, liveMs } from '../utils/time';
import { InlineEdit } from './InlineEdit';
import { EmojiPicker } from './EmojiPicker';

interface Props {
  task: Task;
  selected: boolean;
  badge?: number;
  editing: boolean;
  holdPct?: number;
  onSelect: () => void;
  onEditStart: () => void;
  onEditCommit: (text: string) => void;
  onEditCancel: () => void;
  onEditEmoji: (emoji: string) => void;
  onToggleStatus: () => void;
  onTogglePin: () => void;
  onToggleExpand: () => void;
}

export function TaskItem({
  task,
  selected,
  badge,
  editing,
  holdPct,
  onSelect,
  onEditStart,
  onEditCommit,
  onEditCancel,
  onEditEmoji,
  onToggleStatus,
  onTogglePin,
  onToggleExpand,
}: Props) {
  const [picking, setPicking] = useState(false);
  const has = task.children.length > 0;
  const totalMs =
    liveMs(task) + task.children.reduce((acc, s) => acc + liveMs(s), 0);
  const isRunning =
    task.status === 'running' || task.children.some((s) => s.status === 'running');
  // 父任务的"贪吃蛇"边框只在父任务自己处于 running 时显示；
  // 子任务在跑时，由子任务自己显示边框，父任务保持安静。
  const showSnake = task.status === 'running';
  return (
    <div
      className={`item ${selected ? 'selected' : ''} ${task.status === 'done' ? 'done' : ''} ${showSnake ? 'running' : ''}`}
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
      <StatusIcon status={task.status} onClick={onToggleStatus} />
      {editing ? (
        <span className="emoji-edit-wrap">
          <button
            type="button"
            className="emoji emoji-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              setPicking((p) => !p);
            }}
            title="点击修改 emoji"
          >
            {task.emoji}
          </button>
          {picking && (
            <EmojiPicker
              onPick={(em) => onEditEmoji(em)}
              onClose={() => setPicking(false)}
            />
          )}
        </span>
      ) : (
        <span className="emoji">{task.emoji}</span>
      )}
      {editing ? (
        <InlineEdit
          initial={task.text}
          onSubmit={onEditCommit}
          onCancel={onEditCancel}
        />
      ) : (
        <span className="text">{task.text}</span>
      )}
      {has && !editing && (
        <button
          type="button"
          className="caret"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          title={task.expanded ? '收起' : '展开'}
        >
          {task.expanded ? '▾' : '▸'}
        </button>
      )}
      <span className={'dur' + (isRunning ? ' running' : '')}>{fmt(totalMs)}</span>
      <button
        type="button"
        className={`pin ${task.pinned ? 'on' : ''}`}
        title={task.pinned ? '取消置顶' : '置顶'}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
      >
        {task.pinned ? '📌' : '📍'}
      </button>
    </div>
  );
}
