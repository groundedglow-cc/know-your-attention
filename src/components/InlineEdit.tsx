import { useEffect, useRef, useState } from 'react';

interface Props {
  initial: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export function InlineEdit({ initial, onSubmit, onCancel }: Props) {
  const [v, setV] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <input
      ref={ref}
      data-task-input="true"
      className="inline-edit"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => onCancel()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          e.stopPropagation();
          const t = v.trim();
          if (t) onSubmit(t);
          else onCancel();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onCancel();
        }
      }}
    />
  );
}
