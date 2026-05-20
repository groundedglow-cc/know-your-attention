import './EmojiPicker.css';

const EMOJIS = [
  '📝','💻','📞','🎯','🔥','📚','✅','⚙️','🐛','🚀',
  '💡','📧','🗓️','🍱','☕️','🏃','🧠','🎨','🔍','📊',
  '🛠️','🧪','📦','🔧','✨','⏰','💬','📌','🌱','🌟',
];

interface Props {
  onPick: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onPick, onClose }: Props) {
  return (
    <div className="emoji-pop" onMouseDown={(e) => e.preventDefault()}>
      <div className="emoji-grid">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            className="emoji-btn"
            onClick={() => {
              onPick(e);
              onClose();
            }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
