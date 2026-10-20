import './DateNav.css';
import { formatDateLabel, shiftDateKey, todayKey } from '../utils/time';

interface Props {
  dateKey: string;
  onChange: (key: string) => void;
}

export function DateNav({ dateKey, onChange }: Props) {
  const today = todayKey();
  const isToday = dateKey === today;
  return (
    <div className="dn">
      <button
        type="button"
        className="dn-btn"
        onClick={() => onChange(shiftDateKey(dateKey, -1))}
        title="前一天 ( , )"
        aria-label="前一天"
      >
        ‹
      </button>
      <button
        type="button"
        className={'dn-label' + (isToday ? ' today' : '')}
        onClick={() => onChange(today)}
        title={isToday ? `${dateKey}` : `回到今天 (T)`}
      >
        <span className="dn-text">{formatDateLabel(dateKey)}</span>
        <span className="dn-sub">{dateKey}</span>
      </button>
      <button
        type="button"
        className="dn-btn"
        onClick={() => onChange(shiftDateKey(dateKey, 1))}
        title="后一天 ( . )"
        aria-label="后一天"
      >
        ›
      </button>
    </div>
  );
}
