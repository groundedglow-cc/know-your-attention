// Pure tic-tac-toe logic. No DOM, no timers. The computer strategy is the only
// place that touches randomness; everything else is deterministic.

export const SIZE = 3;
export const CELLS = SIZE * SIZE;
export const CAT = 'cat';
export const DOG = 'dog';

export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

export function emptyCells(board) {
  const out = [];
  for (let i = 0; i < CELLS; i++) if (!board[i]) out.push(i);
  return out;
}

export function winner(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], line };
    }
  }
  return null;
}

export function isFull(board) {
  return board.every((cell) => cell);
}

export function status(board) {
  const w = winner(board);
  if (w) return { state: 'won', player: w.player, line: w.line };
  if (isFull(board)) return { state: 'draw' };
  return { state: 'playing' };
}

export function isLegal(board, index) {
  return Number.isInteger(index) && index >= 0 && index < CELLS && !board[index];
}

// "挑战" wins immediately when it can, otherwise blocks the opponent's
// immediate win, otherwise picks randomly. "轻松" always picks randomly, so
// children can discover winning moves on their own.
export function computerMove(board, computer, difficulty) {
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
export function hint(board, player) {
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
  const preferred = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  return preferred.find((i) => empties.includes(i));
}
