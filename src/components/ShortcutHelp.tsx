import { useEffect, useState } from 'react';
import {
  SHORTCUTS,
  SHORTCUT_GROUP_TITLES,
  type ShortcutDef,
  type ShortcutGroup,
} from '../shortcuts';

const STORAGE_KEY = 'kya:shortcut-collapsed';

export function ShortcutHelp() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const groups = new Map<ShortcutGroup, ShortcutDef[]>();
  for (const s of SHORTCUTS) {
    if (!groups.has(s.group)) groups.set(s.group, []);
    groups.get(s.group)!.push(s);
  }

  if (collapsed) {
    return (
      <button
        type="button"
        className="sh-tab"
        onClick={() => setCollapsed(false)}
        aria-label="展开快捷键提示"
        title="展开快捷键"
      >
        <span className="sh-tab-key">⌘</span>
        <span>快捷键</span>
        <span className="sh-tab-chev">▴</span>
      </button>
    );
  }

  return (
    <div className="sh-help" role="dialog" aria-label="快捷键提示">
      <div className="sh-header">
        <span className="sh-header-title">快捷键</span>
        <button
          type="button"
          className="sh-collapse"
          onClick={() => setCollapsed(true)}
          aria-label="收起到底部"
          title="收起到底部"
        >
          ▾
        </button>
      </div>
      <div className="sh-body">
        {[...groups.entries()].map(([g, items]) => (
          <div key={g} className="sh-group">
            <div className="sh-group-title">{SHORTCUT_GROUP_TITLES[g]}</div>
            {items.map((s) => (
              <div key={s.id} className="sh-row">
                <span className="sh-keys">{s.keysLabel}</span>
                <span className="sh-label">{s.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
