import { ports, tileOpenings } from './engine.js';

const PIPE = { blue: '#409ca3', yellow: '#e6a23c' };
// Border colour for each belt; the yellow border is reddish to contrast with the yellow fill.
const BORDER = { blue: '#d3b780', yellow: '#c9624e' };
const MACHINE = { blue: '#4da6ac', yellow: '#e8b04a' };
const STEM = { blue: '#328f96', yellow: '#d9952c' };
const points = ['50 -3', '103 50', '50 103', '-3 50']; // up, right, down, left

function shell(content) { return `<svg viewBox="0 0 100 100" aria-hidden="true">${content}</svg>`; }

function pipePath(p) {
  if (p.length === 2) {
    const [a, b] = p;
    if ((a + 2) % 4 === b) return `M${points[a]} L${points[b]}`;
    return `M${points[a]} L50 50 L${points[b]}`;
  }
  return 'M50 -3V103M-3 50H103';
}

function pipeStrokes(p, color) {
  const path = pipePath(p);
  const c = PIPE[color] || PIPE.blue;
  const border = BORDER[color] || BORDER.blue;
  return `<path d="${path}" fill="none" stroke="${border}" stroke-width="29" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${c}" stroke-width="22" stroke-linejoin="round"/>`;
}

function candyDecoration(rotation) {
  return `<g transform="rotate(${rotation * 90} 50 50)"><path d="M44 46l-6 -4v13l6 -4m12 -5l6 -4v13l-6 -4" fill="#f6c8ad"/><rect x="43" y="43" width="14" height="11" rx="4" fill="#f8e6b8"/><path d="M47 44l4 9m0 -9l4 9" stroke="#da8c86" stroke-width="2"/></g>`;
}

function pipeTile(tile) {
  const p = ports(tile);
  const cross = tile.kind === 'cross' ? pipeStrokes([1, 3], tile.color) : '';
  return shell(`${pipeStrokes(p, tile.color)}${cross}${candyDecoration(tile.rotation)}`);
}

function sharedCell(tile) {
  const blue = [], yellow = [];
  for (const o of tileOpenings(tile)) (o.color === 'blue' ? blue : yellow).push(o.dir);
  return shell(`${pipeStrokes(blue, 'blue')}${pipeStrokes(yellow, 'yellow')}`);
}

function machine(color, direction) {
  const main = MACHINE[color] || MACHINE.blue;
  const stem = STEM[color] || STEM.blue;
  return shell(`<g transform="rotate(${(direction - 2) * 90} 50 50)"><path d="M50 69V102" stroke="#c7a76b" stroke-width="27"/><path d="M50 69V102" stroke="${stem}" stroke-width="20"/><rect x="39" y="10" width="22" height="8" rx="4" fill="#d98482"/><circle cx="50" cy="47" r="31" fill="${main}" stroke="#dfbb78" stroke-width="4"/><path d="M29 39Q30 28 39 25" stroke="#e5f4ed" stroke-width="5" fill="none" stroke-linecap="round"/><text x="35" y="51" font-size="19">🍬</text><text x="52" y="66" font-size="17">🍬</text><text x="27" y="66" font-size="12">●</text><rect x="33" y="77" width="34" height="8" rx="3" fill="#25777f"/></g>`);
}

function girl(direction) {
  return shell(`<g transform="rotate(${(direction - 2) * 90} 50 50)"><path d="M50 72V102" stroke="#c7a76b" stroke-width="27"/><path d="M50 72V102" stroke="#328f96" stroke-width="20"/><path d="M23 53Q13 15 47 18Q82 9 78 55" fill="#855356"/><circle cx="50" cy="47" r="23" fill="#f6cdb1"/><path d="M28 37Q41 42 46 26Q62 44 73 37Q67 13 44 21Z" fill="#855356"/><path d="M37 48q4 -5 8 0m10 0q4 -5 8 0" fill="none" stroke="#654c47" stroke-width="2.5" stroke-linecap="round"/><path d="M44 56q6 9 13 0" fill="#c17575"/><circle cx="34" cy="54" r="4" fill="#eaa8a2"/><circle cx="67" cy="54" r="4" fill="#eaa8a2"/><rect x="30" y="72" width="40" height="10" rx="4" fill="#25777f"/></g>`);
}

function boy(direction) {
  return shell(`<g transform="rotate(${(direction - 2) * 90} 50 50)"><path d="M50 72V102" stroke="#c7a76b" stroke-width="27"/><path d="M50 72V102" stroke="#d9952c" stroke-width="20"/><circle cx="50" cy="47" r="23" fill="#f4c79a"/><path d="M27 42Q24 16 46 16Q70 12 75 40L70 46Q52 44 34 50Z" fill="#8a5a2b"/><path d="M28 44h44v5q-22 7 -44 0Z" fill="#7a4e24"/><path d="M37 48q4 -5 8 0m10 0q4 -5 8 0" fill="none" stroke="#5d4030" stroke-width="2.5" stroke-linecap="round"/><path d="M44 56q6 9 13 0" fill="#c17575"/><circle cx="34" cy="54" r="4" fill="#eaa8a2"/><circle cx="67" cy="54" r="4" fill="#eaa8a2"/><rect x="30" y="72" width="40" height="10" rx="4" fill="#25777f"/></g>`);
}

export function art(tile, type, direction = 2, color = 'blue') {
  if (type === 'stop') return shell('<circle cx="50" cy="50" r="31" fill="#fff8f4" stroke="#ce7066" stroke-width="6"/><path d="M34 34L66 66M66 34L34 66" stroke="#c85258" stroke-width="8" stroke-linecap="round"/><circle cx="50" cy="50" r="4" fill="#f3b25d"/>');
  if (type === 'start') return color === 'yellow' ? boy(direction) : girl(direction);
  if (type === 'end') return machine(color, direction);
  if (!tile) return shell('<circle cx="50" cy="50" r="3" fill="#d7d9ca"/>');
  if (tile.kind === 'shared' || tile.kind === 'shared-corner') return sharedCell(tile);
  return pipeTile(tile);
}
