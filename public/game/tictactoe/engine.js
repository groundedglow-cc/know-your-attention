// Pure tic-tac-toe logic. No DOM, no timers. Board size and win length are
// configurable, so the same rules drive 3×3 three-in-a-row, 4×4 four-in-a-row,
// or any shorter line on a bigger board.

export const CAT = 'cat';
export const DOG = 'dog';

// Every distinct length-`winLength` segment (horizontal, vertical, and both
// diagonals) that fits on a `size`×`size` board. Each segment is produced once,
// starting from its top-most / left-most cell.
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

// Center first (odd boards), then corners, then edges. Used as a fallback for
// hints when there is no immediate win or block.
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

  // "挑战" wins immediately when it can, otherwise blocks the opponent's
  // immediate win, otherwise picks randomly. "轻松" always picks randomly, so
  // children can discover winning moves on their own.
  function computerMove(board, computer, difficulty) {
    const empties = emptyCells(board);
    if (empties.length === 0) return -1;
    if (difficulty === 'challenge') {
      const winIndex = empties.find((i) => {
        const copy = board.slice();
        copy[i] = computer;
        return winner(copy);
      });
      if (winIndex !== undefined) return winIndex;
      const opponent = computer === CAT ? DOG : CAT;
      const blockIndex = empties.find((i) => {
        const copy = board.slice();
        copy[i] = opponent;
        return winner(copy);
      });
      if (blockIndex !== undefined) return blockIndex;
    }
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
    const opponent = player === CAT ? DOG : CAT;
    const blockIndex = empties.find((i) => {
      const copy = board.slice();
      copy[i] = opponent;
      return winner(copy);
    });
    if (blockIndex !== undefined) return blockIndex;
    return preferred.find((i) => empties.includes(i));
  }

  return { size, cells, winLength, lines, preferred, emptyCells, winner, isFull, status, isLegal, computerMove, hint };
}
