interface Props {
  noteKey: string | null;
  text: string;
  onChange: (v: string) => void;
}

export function NotePanel({ noteKey, text, onChange }: Props) {
  return (
    <aside className="np">
      {!noteKey ? (
        <div className="np-empty">选中一个事项以记录</div>
      ) : (
        <>
          <div className="np-head">
            <span className="np-head-title">备注</span>
            <span className="np-head-hint">输入即自动保存</span>
          </div>
          <textarea
            key={noteKey}
            data-task-input="true"
            className="np-area"
            value={text}
            onChange={(e) => onChange(e.target.value)}
            placeholder="记录此事项的进展、问题、思路…"
          />
        </>
      )}
    </aside>
  );
}
