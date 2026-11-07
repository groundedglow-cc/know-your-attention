// Self-drawn SVG characters. The cat has a round base and the dog has a
// square base, so the two sides are told apart by shape as well as color.

export const catPiece = () => `<svg viewBox="0 0 120 120" role="img" aria-hidden="true">
  <path d="M30 42 L37 12 L53 30 Z" fill="#e8894f"/>
  <path d="M90 42 L83 12 L67 30 Z" fill="#e8894f"/>
  <path d="M34 38 L38 22 L46 31 Z" fill="#f7c9a0"/>
  <path d="M86 38 L82 22 L74 31 Z" fill="#f7c9a0"/>
  <circle cx="60" cy="71" r="43" fill="#f6a75c" stroke="#c96f3a" stroke-width="4"/>
  <ellipse cx="45" cy="64" rx="4" ry="5.5" fill="#4a3a2a"/>
  <ellipse cx="75" cy="64" rx="4" ry="5.5" fill="#4a3a2a"/>
  <circle cx="46.5" cy="62" r="1.6" fill="#fff"/>
  <circle cx="76.5" cy="62" r="1.6" fill="#fff"/>
  <path d="M60 74 L55 80 Q60 84 65 80 Z" fill="#e8894f"/>
  <path d="M60 80 Q60 84 55 84 M60 80 Q60 84 65 84" stroke="#4a3a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M31 72 L13 68 M31 79 L13 82 M89 72 L107 68 M89 79 L107 82" stroke="#c96f3a" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

export const dogPiece = () => `<svg viewBox="0 0 120 120" role="img" aria-hidden="true">
  <ellipse cx="22" cy="54" rx="13" ry="25" fill="#5f87b0"/>
  <ellipse cx="98" cy="54" rx="13" ry="25" fill="#5f87b0"/>
  <rect x="24" y="27" width="72" height="72" rx="17" fill="#7ea8cf" stroke="#4a6f96" stroke-width="4"/>
  <ellipse cx="45" cy="57" rx="4" ry="5" fill="#3a3a3a"/>
  <ellipse cx="75" cy="57" rx="4" ry="5" fill="#3a3a3a"/>
  <circle cx="46.5" cy="55" r="1.6" fill="#fff"/>
  <circle cx="76.5" cy="55" r="1.6" fill="#fff"/>
  <ellipse cx="60" cy="74" rx="6.5" ry="5.5" fill="#3a3a3a"/>
  <path d="M60 79 Q60 86 54 86 M60 79 Q60 86 66 86" stroke="#3a3a3a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M55 86 Q60 94 65 86 Z" fill="#e8894f"/>
</svg>`;

export const piece = (kind) => (kind === 'dog' ? dogPiece() : catPiece());
