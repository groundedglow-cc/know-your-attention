// Directions: 0 up, 1 right, 2 down, 3 left. Indices are row-major, zero-based.
//
// A single-colour tile is { kind: 'straight'|'corner'|'cross', color: 'blue'|'yellow', rotation: 0..3 }.
// A shared tile (both belts pass through one square) is:
//   { kind: 'shared', rotation: 0|1 }         — shared overpass (blue & yellow each straight through)
//   { kind: 'shared-corner', rotation: 0..3 } — shared double-bend (blue & yellow each bend)
// Shared tiles may be pre-placed (in `given`) or chosen from the palette.

export const COLORS = ['blue', 'yellow'];
export const KINDS = ['straight', 'corner', 'cross'];

export function pieceName(color, kind) {
  if (kind === 'shared') return '双色立交';
  if (kind === 'shared-corner') return '双色弯管';
  const c = color === 'blue' ? '蓝' : '黄';
  const k = kind === 'straight' ? '直管' : kind === 'corner' ? '弯管' : '交叉管';
  return `${c}色${k}`;
}

export function neighbor(index, d, n) {
  const r = Math.floor(index / n), c = index % n;
  return d === 0 ? (r ? index - n : -1)
    : d === 1 ? (c < n - 1 ? index + 1 : -1)
    : d === 2 ? (r < n - 1 ? index + n : -1)
    : (c ? index - 1 : -1);
}

export function ports(tile) {
  if (!tile) return [];
  const base = tile.kind === 'straight' ? [0, 2] : tile.kind === 'corner' ? [0, 1] : [0, 1, 2, 3];
  return base.map(d => (d + tile.rotation) % 4).sort((a, b) => a - b);
}

function sharedPortsOf(tile) {
  const r = tile.rotation;
  if (tile.kind === 'shared-corner') {
    return { blue: [(r) % 4, (r + 1) % 4], yellow: [(r + 2) % 4, (r + 3) % 4] };
  }
  const rr = r % 2;
  return { blue: [rr, (rr + 2) % 4], yellow: [(rr + 1) % 4, (rr + 3) % 4] };
}

// Ports of a tile regardless of where it sits on the board, as [{ dir, color }].
export function tileOpenings(tile) {
  if (!tile) return [];
  if (tile.kind === 'shared' || tile.kind === 'shared-corner') {
    const { blue, yellow } = sharedPortsOf(tile);
    return [
      ...blue.map(d => ({ dir: d, color: 'blue' })),
      ...yellow.map(d => ({ dir: d, color: 'yellow' })),
    ];
  }
  return ports(tile).map(d => ({ dir: d, color: tile.color }));
}

export function isStop(level, i) { return level.stops.includes(i); }
export function isEndpoint(level, i) { return level.belts.some(b => b.start.index === i || b.end.index === i); }
export function isGiven(level, i) { return !!level.given[i]; }
export function fixed(level, i) { return isStop(level, i) || isEndpoint(level, i) || isGiven(level, i); }

export function openings(level, board, i) {
  if (isStop(level, i)) return [];
  for (const b of level.belts) {
    if (b.start.index === i) return [{ dir: b.start.direction, color: b.color }];
    if (b.end.index === i) return [{ dir: b.end.direction, color: b.color }];
  }
  return tileOpenings(board[i] || level.given[i]);
}

function isSharedTile(t) { return t && (t.kind === 'shared' || t.kind === 'shared-corner'); }

export function complete(level, board) {
  const n = level.size, count = n * n;
  for (let i = 0; i < count; i++) if (!fixed(level, i) && !board[i]) return false;
  for (let i = 0; i < count; i++) {
    for (const { dir, color } of openings(level, board, i)) {
      const j = neighbor(i, dir, n);
      if (j < 0) return false;
      const opp = openings(level, board, j).find(o => o.dir === (dir + 2) % 4);
      if (!opp || opp.color !== color) return false;
    }
  }
  const coveredBy = {};
  for (const b of level.belts) {
    const route = traceRoute(level, board, b.color);
    if (!route) return false;
    for (const cell of route.visited) (coveredBy[cell] ||= new Set()).add(b.color);
  }
  for (let i = 0; i < count; i++) {
    if (isStop(level, i)) continue;
    const colors = coveredBy[i] || new Set();
    if (isSharedTile(board[i] || level.given[i])) { if (colors.size !== 2) return false; }
    else if (colors.size !== 1) return false;
  }
  return true;
}

function exitDirection(level, board, i, incoming, color) {
  const t = board[i] || level.given[i];
  if (!t) return -1;
  if (t.kind === 'cross' && t.color === color) return (incoming + 2) % 4;
  const candidates = openings(level, board, i).filter(o => o.color === color && o.dir !== incoming);
  return candidates.length === 1 ? candidates[0].dir : -1;
}

function traceRoute(level, board, color) {
  const belt = level.belts.find(b => b.color === color);
  const n = level.size;
  const visited = new Set([belt.start.index]);
  const edges = new Set();
  let i = belt.start.index;
  let out = belt.start.direction;
  while (true) {
    const edge = `${i}:${out}`;
    if (edges.has(edge)) return null;
    edges.add(edge);
    const j = neighbor(i, out, n);
    if (j < 0) return null;
    visited.add(j);
    if (j === belt.end.index) break;
    out = exitDirection(level, board, j, (out + 2) % 4, color);
    if (out < 0) return null;
    i = j;
  }
  return { visited, edges };
}

export function solve(level, initial = [], limits = null) {
  const n = level.size, count = n * n;
  const board = Array.from({ length: count }, (_, i) => initial[i] || null);
  const colors = [...new Set(level.belts.map(b => b.color))];
  const variants = [];
  for (const color of colors) {
    for (const kind of KINDS) {
      const rotations = kind === 'straight' ? [0, 1] : kind === 'corner' ? [0, 1, 2, 3] : [0];
      for (const rotation of rotations) variants.push({ kind, color, rotation });
    }
  }
  if (colors.length === 2) {
    variants.push({ kind: 'shared', rotation: 0 }, { kind: 'shared', rotation: 1 });
    for (let r = 0; r < 4; r++) variants.push({ kind: 'shared-corner', rotation: r });
  }
  function keyOf(t) { return t.kind === 'shared' || t.kind === 'shared-corner' ? t.kind : `${t.color}-${t.kind}`; }
  function withinLimits() {
    if (!limits) return true;
    for (const t of board) if (t) {
      const key = keyOf(t);
      const used = board.filter(x => x && keyOf(x) === key).length;
      if (used > (limits[key] || 0)) return false;
    }
    return true;
  }
  function portColorAt(tile, d) {
    const op = tileOpenings(tile).find(o => o.dir === d);
    return op ? op.color : null;
  }
  function compatible(i, tile) {
    for (let d = 0; d < 4; d++) {
      const j = neighbor(i, d, n);
      const myColor = portColorAt(tile, d);
      if (j < 0 || isStop(level, j)) {
        if (myColor) return false;
      } else if (fixed(level, j) || board[j]) {
        const opp = openings(level, board, j).find(o => o.dir === (d + 2) % 4);
        const oppColor = opp ? opp.color : null;
        if (myColor ? oppColor !== myColor : oppColor !== null) return false;
      }
    }
    return true;
  }
  for (let i = 0; i < count; i++) if (board[i] && (fixed(level, i) || !compatible(i, board[i]))) return null;
  function search() {
    if (!withinLimits()) return null;
    let target = -1, choices = null;
    for (let i = 0; i < count; i++) {
      if (fixed(level, i) || board[i]) continue;
      const options = variants.filter(t => compatible(i, t));
      if (!options.length) return null;
      if (!choices || options.length < choices.length) { target = i; choices = options; }
    }
    if (target < 0) return complete(level, board) ? board.map(t => t && { ...t }) : null;
    for (const t of choices) {
      board[target] = t;
      const answer = search();
      if (answer) return answer;
    }
    board[target] = null;
    return null;
  }
  return search();
}

export function paletteFor(level) {
  const solution = solve(level);
  const counts = {};
  if (!solution) return counts;
  for (const t of solution) {
    if (!t) continue;
    const key = t.kind === 'shared' || t.kind === 'shared-corner' ? t.kind : `${t.color}-${t.kind}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function hint(level, board) {
  const limits = level.palette || null;
  const answer = solve(level, [], limits);
  if (!answer) return null;
  const solution = solve(level, board, limits);
  if (solution) {
    const i = solution.findIndex((t, i) => t && !board[i]);
    return i < 0 ? null : { index: i, tile: solution[i], error: false };
  }
  for (let i = 0; i < board.length; i++) if (board[i]) {
    const copy = [...board]; copy[i] = null;
    if (solve(level, copy, limits)) return { index: i, error: true };
  }
  const i = board.findIndex((t, i) => t && answer[i] && (t.kind !== answer[i].kind || t.color !== answer[i].color || ports(t).join() !== ports(answer[i]).join()));
  return i < 0 ? null : { index: i, error: true };
}
