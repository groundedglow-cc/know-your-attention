// Pure tic-tac-toe logic. No DOM, no timers, no network. Board size and win
// length are configurable; the computer opponent supports three strategies:
//   'random'  - picks any legal cell
//   'oneply'  - win now if possible, else block, else random
//   'minimax' - depth-limited negamax with alpha-beta (sees forks/双威胁)

export const CAT = 'cat';
export const DOG = 'dog';

const WIN_SCORE = 1e6;
// Score for k friendly pieces in an open line (no opponent pieces).
const LINE_WEIGHTS = [0, 1, 10, 100, 1000, 10000];

// Every distinct length-`winLength` segment (horizontal, vertical, and both
// diagonals) that fits on a `size`×`size` board.
export function winLines(size, winLength) {
  const lines = [];
  const idx = (r, c) => r * size + c;
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of dirs) {
        const er = r + dr * (winLength - 1);
        const ec = c + dc * (winLength - 1);
        if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
        const line = [];
        for (let k = 0; k < winLength; k++) line.push(idx(r + dr * k, c + dc * k));
        lines.push(line);
      }
    }
  }
  return lines;
}

// Center first (odd boards), then corners, then edges.
function preferredOrder(size) {
  const center = [];
  const corners = [];
  const edges = [];
  const half = (size - 1) / 2;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      const isCenter = size % 2 === 1 && r === half && c === half;
      const isCorner = (r === 0 || r === size - 1) && (c === 0 || c === size - 1);
      if (isCenter) center.push(i);
      else if (isCorner) corners.push(i);
      else edges.push(i);
    }
  }
  return [...center, ...corners, ...edges];
}

export function createGame(size = 3, winLength = size) {
  const cells = size * size;
  const lines = winLines(size, winLength);
  const preferred = preferredOrder(size);
  const other = (p) => (p === CAT ? DOG : CAT);

  function emptyCells(board) {
    const out = [];
    for (let i = 0; i < cells; i++) if (!board[i]) out.push(i);
    return out;
  }

  function winner(board) {
    for (const line of lines) {
      const first = board[line[0]];
      if (first && line.every((i) => board[i] === first)) {
        return { player: first, line };
      }
    }
    return null;
  }

  function isFull(board) {
    return board.every((cell) => cell);
  }

  function status(board) {
    const w = winner(board);
    if (w) return { state: 'won', player: w.player, line: w.line };
    if (isFull(board)) return { state: 'draw' };
    return { state: 'playing' };
  }

  function isLegal(board, index) {
    return Number.isInteger(index) && index >= 0 && index < cells && !board[index];
  }

  // Static positional score from `player`'s perspective (used at the search
  // horizon). A friendly open line counts up; an opponent open line counts down.
  function heuristic(board, player) {
    const opp = other(player);
    let score = 0;
    for (const line of lines) {
      let p = 0;
      let o = 0;
      for (const i of line) {
        if (board[i] === player) p++;
        else if (board[i] === opp) o++;
      }
      if (o === 0 && p > 0) score += LINE_WEIGHTS[p] || 0;
      else if (p === 0 && o > 0) score -= LINE_WEIGHTS[o] || 0;
    }
    return score;
  }

  // Candidate moves ordered to make alpha-beta prune fast: immediate wins
  // first, then blocks, then the rest by center/corner/edge preference.
  function orderedMoves(board, player) {
    const opp = other(player);
    const empties = emptyCells(board);
    const wins = [];
    const blocks = [];
    const rest = [];
    for (const i of empties) {
      const b1 = board.slice();
      b1[i] = player;
      if (winner(b1)) { wins.push(i); continue; }
      const b2 = board.slice();
      b2[i] = opp;
      if (winner(b2)) { blocks.push(i); continue; }
      rest.push(i);
    }
    rest.sort((a, b) => preferred.indexOf(a) - preferred.indexOf(b));
    return [...wins, ...blocks, ...rest];
  }

  // Negamax from the perspective of `player` (to move). Returns a score where
  // positive favors `player`.
  function negamax(board, player, depth, alpha, beta) {
    if (winner(board)) return -WIN_SCORE;
    if (isFull(board)) return 0;
    if (depth <= 0) return heuristic(board, player);
    let best = -Infinity;
    for (const i of orderedMoves(board, player)) {
      board[i] = player;
      const v = -negamax(board, other(player), depth - 1, -beta, -alpha);
      board[i] = null;
      if (v > best) best = v;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  function bestMove(board, computer, depth = 4) {
    const empties = emptyCells(board);
    if (empties.length === 0) return -1;
    let bestScore = -Infinity;
    let bestIndex = empties[0];
    for (const i of orderedMoves(board, computer)) {
      board[i] = computer;
      const v = -negamax(board, other(computer), depth - 1, -Infinity, Infinity);
      board[i] = null;
      if (v > bestScore) {
        bestScore = v;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  function computerMove(board, computer, ai = 'oneply') {
    const empties = emptyCells(board);
    if (empties.length === 0) return -1;
    if (ai === 'random') return empties[Math.floor(Math.random() * empties.length)];
    if (ai === 'minimax') return bestMove(board, computer);
    // oneply
    const winIndex = empties.find((i) => {
      const copy = board.slice();
      copy[i] = computer;
      return winner(copy);
    });
    if (winIndex !== undefined) return winIndex;
    const opp = other(computer);
    const blockIndex = empties.find((i) => {
      const copy = board.slice();
      copy[i] = opp;
      return winner(copy);
    });
    if (blockIndex !== undefined) return blockIndex;
    return empties[Math.floor(Math.random() * empties.length)];
  }

  // Prefer a winning move, then a blocking move, then center/corner/edge.
  function hint(board, player) {
    const empties = emptyCells(board);
    if (empties.length === 0) return -1;
    const winIndex = empties.find((i) => {
      const copy = board.slice();
      copy[i] = player;
      return winner(copy);
    });
    if (winIndex !== undefined) return winIndex;
    const opp = other(player);
    const blockIndex = empties.find((i) => {
      const copy = board.slice();
      copy[i] = opp;
      return winner(copy);
    });
    if (blockIndex !== undefined) return blockIndex;
    return preferred.find((i) => empties.includes(i));
  }

  return { size, cells, winLength, lines, preferred, emptyCells, winner, isFull, status, isLegal, computerMove, bestMove, hint };
}
