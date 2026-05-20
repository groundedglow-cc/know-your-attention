export type TabKey = 'tasks' | 'notes';

interface Props {
  active: TabKey;
  onChange: (k: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'tasks', label: '事项' },
  { key: 'notes', label: '随手记' },
];

export function Tabs({ active, onChange }: Props) {
  return (
    <div className="tabs">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`tab ${active === t.key ? 'on' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
