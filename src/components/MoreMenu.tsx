import { useEffect, useRef, useState } from 'react';
import {
  exportJson,
  exportMarkdown,
  importJsonFile,
  resetAll,
} from '../utils/exportImport';

interface Props {
  peekOpacity: number;
  onPeekChange: (v: number) => void;
  showDone: boolean;
  onToggleShowDone: () => void;
}

export function MoreMenu({
  peekOpacity,
  onPeekChange,
  showDone,
  onToggleShowDone,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const handleImport = async (file: File) => {
    const r = await importJsonFile(file);
    if (r.ok) {
      const c = r.counts;
      window.alert(
        c
          ? `导入完成：新增 ${c.tasks} 项事项，${c.notes} 条随手记，${c.taskNotes} 个备注。即将刷新。`
          : '导入完成，即将刷新。',
      );
      window.location.reload();
    } else {
      window.alert('导入失败：' + (r.error || '未知错误'));
    }
  };

  const handleReset = () => {
    if (
      window.confirm('确定要清空所有数据吗？此操作不可撤销。建议先导出 JSON 备份。')
    ) {
      resetAll();
      window.location.reload();
    }
  };

  return (
    <div className="more" ref={wrapRef}>
      <button
        className="more-btn"
        type="button"
        title="更多"
        onClick={() => setOpen((o) => !o)}
      >
        ⋯
      </button>
      {open && (
        <div className="more-menu" role="menu">
          <div className="more-section">
            <div className="more-section-title">
              <span>防窥</span>
              <span className="more-slider-val">{peekOpacity}%</span>
            </div>
            <div className="more-slider-row">
              <span
                className="peek-icon"
                title="防窥（失焦时变透明）"
              >
                🙈
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={peekOpacity}
                onChange={(e) => onPeekChange(parseInt(e.target.value, 10))}
                className="more-slider"
              />
              <span className="peek-icon" title="不防窥">
                👁️
              </span>
            </div>
          </div>
          <div className="more-sep" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onToggleShowDone();
            }}
          >
            {showDone ? '隐藏已完成 (H)' : '显示已完成 (H)'}
          </button>
          <div className="more-sep" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              exportMarkdown();
            }}
          >
            导出 Markdown
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              exportJson();
            }}
          >
            导出 JSON
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              fileRef.current?.click();
            }}
          >
            导入数据
          </button>
          <div className="more-sep" />
          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={() => {
              setOpen(false);
              handleReset();
            }}
          >
            重置
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              if (fileRef.current) fileRef.current.value = '';
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
