// Self-drawn SVG characters. The cat has a round base and the robot has a
// square base, so the two sides are told apart by shape as well as color.

export const catPiece = () => `<svg viewBox="0 0 120 120" role="img" aria-hidden="true">
  <path d="M28 44 L36 12 L52 30 Z" fill="#e8894f"/>
  <path d="M92 44 L84 12 L68 30 Z" fill="#e8894f"/>
  <path d="M32 40 L37 20 L45 31 Z" fill="#f7c9a0"/>
  <path d="M88 40 L83 20 L75 31 Z" fill="#f7c9a0"/>
  <circle cx="60" cy="70" r="42" fill="#f6a75c" stroke="#d97f3a" stroke-width="4"/>
  <circle cx="40" cy="76" r="7" fill="#f7a58a" opacity="0.65"/>
  <circle cx="80" cy="76" r="7" fill="#f7a58a" opacity="0.65"/>
  <circle cx="47" cy="63" r="6" fill="#3a2a20"/>
  <circle cx="73" cy="63" r="6" fill="#3a2a20"/>
  <circle cx="49" cy="60.5" r="2.4" fill="#fff"/>
  <circle cx="75" cy="60.5" r="2.4" fill="#fff"/>
  <path d="M60 72 L56 78 Q60 82 64 78 Z" fill="#e8894f"/>
  <path d="M60 78 Q60 82 55 82 M60 78 Q60 82 65 82" stroke="#3a2a20" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M28 72 L12 68 M28 78 L12 80 M92 72 L108 68 M92 78 L108 80" stroke="#d97f3a" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

export const robotPiece = () => `<svg viewBox="0 0 120 120" role="img" aria-hidden="true">
  <line x1="60" y1="22" x2="60" y2="7" stroke="#5f87b0" stroke-width="4" stroke-linecap="round"/>
  <circle cx="60" cy="6" r="6" fill="#f2c14e" stroke="#d9a63c" stroke-width="2"/>
  <rect x="11" y="42" width="11" height="16" rx="4" fill="#5f87b0" stroke="#4a6f96" stroke-width="3"/>
  <rect x="98" y="42" width="11" height="16" rx="4" fill="#5f87b0" stroke="#4a6f96" stroke-width="3"/>
  <rect x="26" y="26" width="68" height="68" rx="18" fill="#7ea8cf" stroke="#4a6f96" stroke-width="4"/>
  <rect x="37" y="41" width="46" height="32" rx="11" fill="#eaf3fa"/>
  <circle cx="50" cy="57" r="5" fill="#3a5a7a"/>
  <circle cx="70" cy="57" r="5" fill="#3a5a7a"/>
  <circle cx="51.7" cy="55.3" r="1.9" fill="#fff"/>
  <circle cx="71.7" cy="55.3" r="1.9" fill="#fff"/>
  <path d="M52 68 Q60 74 68 68" stroke="#3a5a7a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <circle cx="33" cy="33" r="2" fill="#4a6f96"/>
  <circle cx="87" cy="33" r="2" fill="#4a6f96"/>
  <circle cx="33" cy="87" r="2" fill="#4a6f96"/>
  <circle cx="87" cy="87" r="2" fill="#4a6f96"/>
</svg>`;
