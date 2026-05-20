import './Header.css';
import { MoreMenu } from './MoreMenu';

interface Props {
  onAdd: () => void;
  peekOpacity: number;
  onPeekChange: (v: number) => void;
  showDone: boolean;
  onToggleShowDone: () => void;
}

export function Header({
  onAdd,
  peekOpacity,
  onPeekChange,
  showDone,
  onToggleShowDone,
}: Props) {
  return (
    <header className="hd">
      <div className="hd-brand">
        <svg
          className="hd-logo"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* 外圈：散乱的注意力（虚线、淡） */}
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="2 2.5"
            opacity="0.35"
          />
          {/* 中圈：被聚拢的注意力 */}
          <circle
            cx="12"
            cy="12"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            opacity="0.7"
          />
          {/* 中心：当下投入的焦点 */}
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
        </svg>
        <div className="hd-title">Know Your Attention</div>
      </div>
      <div className="hd-actions">
        <button
          className="hd-add"
          type="button"
          onClick={onAdd}
          title="新增 (N) / 强制新增父项 (Shift+N)"
        >
          ＋
        </button>
        <MoreMenu
          peekOpacity={peekOpacity}
          onPeekChange={onPeekChange}
          showDone={showDone}
          onToggleShowDone={onToggleShowDone}
        />
      </div>
    </header>
  );
}
