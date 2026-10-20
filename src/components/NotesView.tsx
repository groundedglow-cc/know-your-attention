import { useState } from 'react';
import { useNotesStore } from '../notesStore';
import { TaskInput } from './TaskInput';
import { InlineEdit } from './InlineEdit';

interface Props {
  adding: boolean;
  onCancelAdd: () => void;
}

export function NotesView({ adding, onCancelAdd }: Props) {
  const store = useNotesStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <>
      {adding && (
        <TaskInput
          showEmoji={false}
          placeholder="记一笔，Cmd+Enter 保存"
          onSubmit={(text) => {
            store.add(text);
            onCancelAdd();
          }}
          onCancel={onCancelAdd}
        />
      )}
      {store.notes.length === 0 && !adding && (
        <div className="empty">还没有笔记。按 N 新增</div>
      )}
      {store.notes.map((n) => (
        <div
          key={n.id}
          className="note"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingId(n.id);
          }}
        >
          {editingId === n.id ? (
            <InlineEdit
              initial={n.text}
              onSubmit={(t) => {
                store.update(n.id, t);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <>
              <span className="note-text">{n.text}</span>
              <button
                type="button"
                className="note-del"
                title="删除"
                onClick={(e) => {
                  e.stopPropagation();
                  store.remove(n.id);
                }}
              >
                ×
              </button>
            </>
          )}
        </div>
      ))}
    </>
  );
}
