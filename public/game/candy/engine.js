export const kinds = ['straight', 'corner', 'cross'];
export const names = { straight: '直管', corner: '弯管', cross: '交叉管' };
export const limits = { straight: 10, corner: 10, cross: 5 };
export function ports(tile) {
  if (!tile) return [];
  return (tile.kind === 'straight' ? [0, 2] : tile.kind === 'corner' ? [0, 1] : [0, 1, 2, 3]).map(d => (d + tile.rotation) % 4).sort();
}
export function neighbor(index, d, n) {
  const r = Math.floor(index / n), c = index % n;
  return d === 0 ? (r ? index - n : -1) : d === 1 ? (c < n - 1 ? index + 1 : -1) : d === 2 ? (r < n - 1 ? index + n : -1) : (c ? index - 1 : -1);
}
export function fixed(level, i) { return level.stops.includes(i) || i === level.start.index || i === level.end.index; }
export function openings(level, board, i) {
  if (i === level.start.index) return [level.start.direction];
  if (i === level.end.index) return [level.end.direction];
  return ports(board[i]);
}
export function complete(level, board) {
  const count = level.size ** 2;
  for (let i = 0; i < count; i++) {
    if (!fixed(level, i) && !board[i]) return false;
    for (const d of openings(level, board, i)) {
      const j = neighbor(i, d, level.size);
      if (j < 0 || !openings(level, board, j).includes((d + 2) % 4)) return false;
    }
  }
  // Crossings are two independent pipes, not a four-way junction.
  let i = level.start.index, out = level.start.direction;
  const visited = new Set([i]), edges = new Set();
  while (true) {
    const j = neighbor(i, out, level.size);
    if (j < 0 || edges.has(`${i}:${out}`)) return false;
    edges.add(`${i}:${out}`); visited.add(j);
    if (j === level.end.index) break;
    const tile = board[j], incoming = (out + 2) % 4;
    if (!tile) return false;
    out = tile.kind === 'cross' ? (incoming + 2) % 4 : ports(tile).find(d => d !== incoming);
    i = j;
  }
  return visited.size === count - level.stops.length && edges.size === count - level.stops.length - 1 + board.filter(t => t?.kind === 'cross').length;
}
const variants = kinds.flatMap(kind => Array.from({ length: kind === 'straight' ? 2 : kind === 'corner' ? 4 : 1 }, (_, rotation) => ({ kind, rotation })));
export function solve(level, initial = []) {
  const board = Array.from({ length: level.size ** 2 }, (_, i) => initial[i] || null);
  function compatible(i, tile) {
    const p = ports(tile);
    for (let d = 0; d < 4; d++) {
      const j = neighbor(i, d, level.size);
      const connected = p.includes(d);
      if (j < 0 || level.stops.includes(j)) { if (connected) return false; }
      else if (fixed(level, j) || board[j]) {
        if (connected !== openings(level, board, j).includes((d + 2) % 4)) return false;
      }
    }
    return true;
  }
  for (let i = 0; i < board.length; i++) if (board[i] && (fixed(level, i) || !compatible(i, board[i]))) return null;
  function search() {
    const used = Object.fromEntries(kinds.map(k => [k, board.filter(t => t?.kind === k).length]));
    if (kinds.some(k => used[k] > limits[k])) return null;
    let target = -1, choices;
    for (let i = 0; i < board.length; i++) if (!fixed(level, i) && !board[i]) {
      const options = variants.filter(t => used[t.kind] < limits[t.kind] && compatible(i, t));
      if (!options.length) return null;
      if (!choices || options.length < choices.length) { target = i; choices = options; }
    }
    if (target < 0) return complete(level, board) ? board.map(t => t && { ...t }) : null;
    for (const t of choices) { board[target] = t; const answer = search(); if (answer) return answer; }
    board[target] = null; return null;
  }
  return search();
}
export function hint(level, board) {
  const answer = solve(level, board);
  if (answer) {
    const i = answer.findIndex((t, i) => t && !board[i]);
    return i < 0 ? null : { index: i, tile: answer[i], error: false };
  }
  // Find a single correction which restores solvability; otherwise one conflicting
  // tile relative to a valid solution. Never claim that solution is the only one.
  for (let i = 0; i < board.length; i++) if (board[i]) {
    const copy = [...board]; copy[i] = null;
    if (solve(level, copy)) return { index: i, error: true };
  }
  const base = solve(level);
  const i = board.findIndex((t, i) => t && base?.[i] && ports(t).join() !== ports(base[i]).join());
  return i < 0 ? null : { index: i, error: true };
}
