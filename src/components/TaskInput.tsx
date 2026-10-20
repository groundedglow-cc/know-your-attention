import { useEffect, useRef, useState } from 'react';
import { EmojiPicker } from './EmojiPicker';
import './TaskInput.css';

interface Props {
  showEmoji?: boolean;
  initialEmoji?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit: (text: string, emoji: string) => void;
  onCancel?: () => void;
}

export function TaskInput({
  showEmoji = true,
  initialEmoji = '📝',
  placeholder = '输入事项，Cmd+Enter 完成',
  autoFocus = true,
  onSubmit,
  onCancel,
}: Props) {
  const [emoji, setEmoji] = useState(initialEmoji);
  const [text, setText] = useState('');
  const [picking, setPicking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const submit = () => {
    const v = text.trim();
    if (!v) {
      onCancel?.();
      return;
    }
    onSubmit(v, emoji);
    setText('');
  };

  return (
    <div className="ti-row" data-task-input="true">
      {showEmoji && (
        <div className="ti-emoji-wrap">
          <button
            type="button"
            className="ti-emoji"
            onClick={() => setPicking((p) => !p)}
            tabIndex={-1}
          >
            {emoji}
          </button>
          {picking && (
            <EmojiPicker onPick={setEmoji} onClose={() => setPicking(false)} />
          )}
        </div>
      )}
      <input
        ref={inputRef}
        className="ti-input"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            e.stopPropagation();
            submit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onCancel?.();
          }
        }}
      />
    </div>
  );
}
