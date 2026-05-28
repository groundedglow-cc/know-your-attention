import type { ReactNode } from 'react';
import './Header.css';
import { MoreMenu } from './MoreMenu';

interface Props {
  onAdd: () => void;
  peekOpacity: number;
  onPeekChange: (v: number) => void;
  showDone: boolean;
  onToggleShowDone: () => void;
  center?: ReactNode;
}

export function Header({
  onAdd,
  peekOpacity,
  onPeekChange,
  showDone,
  onToggleShowDone,
  center,
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
          <defs>
            <linearGradient id="hd-logo-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          {/* 圆乎乎的小脸 */}
          <circle cx="12" cy="13" r="9" fill="url(#hd-logo-grad)" />
          {/* 眨眼：左眼弯弯，右眼圆圆 */}
          <path
            d="M7.8 12.2 Q9 10.8 10.2 12.2"
            fill="none"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="15" cy="11.6" r="1.1" fill="#fff" />
          {/* 微笑 */}
          <path
            d="M8.5 15.4 Q12 18 15.5 15.4"
            fill="none"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* 头顶小亮星 */}
          <path
            d="M19.5 4 L20.4 5.6 L22 6.5 L20.4 7.4 L19.5 9 L18.6 7.4 L17 6.5 L18.6 5.6 Z"
            fill="#fde047"
            stroke="#f59e0b"
            strokeWidth="0.4"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {center && <div className="hd-center">{center}</div>}
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
