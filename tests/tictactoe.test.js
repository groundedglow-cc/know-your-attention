import test from 'node:test';
import assert from 'node:assert/strict';
import { CAT, DOG, createGame, winLines } from '../public/game/tictactoe/engine.js';

const g3 = createGame(3, 3);
const g4 = createGame(4, 4);
const g43 = createGame(4, 3);

function boardOf(game, filled = {}) {
  const b = Array(game.cells).fill(null);
  for (const [i, v] of Object.entries(filled)) b[i] = v;
  return b;
}

test('3×3 three-in-a-row: rows, columns, both diagonals', () => {
  assert.deepEqual(g3.winner(boardOf(g3, { 0: CAT, 1: CAT, 2: CAT })), { player: CAT, line: [0, 1, 2] });
  assert.deepEqual(g3.winner(boardOf(g3, { 0: DOG, 3: DOG, 6: DOG })), { player: DOG, line: [0, 3, 6] });
  assert.deepEqual(g3.winner(boardOf(g3, { 0: CAT, 4: CAT, 8: CAT })), { player: CAT, line: [0, 4, 8] });
  assert.deepEqual(g3.winner(boardOf(g3, { 2: CAT, 4: CAT, 6: CAT })), { player: CAT, line: [2, 4, 6] });
  assert.equal(g3.winner(boardOf(g3)), null);
});

test('4×4 four-in-a-row: rows, columns, both diagonals', () => {
  assert.deepEqual(g4.winner(boardOf(g4, { 0: CAT, 1: CAT, 2: CAT, 3: CAT })), { player: CAT, line: [0, 1, 2, 3] });
  assert.deepEqual(g4.winner(boardOf(g4, { 0: DOG, 4: DOG, 8: DOG, 12: DOG })), { player: DOG, line: [0, 4, 8, 12] });
  assert.deepEqual(g4.winner(boardOf(g4, { 0: CAT, 5: CAT, 10: CAT, 15: CAT })), { player: CAT, line: [0, 5, 10, 15] });
  assert.deepEqual(g4.winner(boardOf(g4, { 3: CAT, 6: CAT, 9: CAT, 12: CAT })), { player: CAT, line: [3, 6, 9, 12] });
});

test('4×4 three-in-a-row finds off-center segments', () => {
  assert.deepEqual(g43.winner(boardOf(g43, { 1: CAT, 2: CAT, 3: CAT })), { player: CAT, line: [1, 2, 3] });
  assert.deepEqual(g43.winner(boardOf(g43, { 5: CAT, 6: CAT, 7: CAT })), { player: CAT, line: [5, 6, 7] });
});

test('last cell that both fills and wins reports a win, not a draw', () => {
  const b = boardOf(g3, { 0: CAT, 1: DOG, 2: CAT, 3: DOG, 4: CAT, 5: DOG, 6: DOG, 7: CAT });
  assert.equal(g3.status(b).state, 'playing');
  b[8] = CAT;
  assert.equal(g3.isFull(b), true);
  assert.equal(g3.status(b).state, 'won');
  assert.deepEqual(g3.status(b).line, [0, 4, 8]);
});

test('draw when full with no winner', () => {
  const b = boardOf(g3, { 0: CAT, 1: CAT, 2: DOG, 3: DOG, 4: DOG, 5: CAT, 6: CAT, 7: DOG, 8: CAT });
  assert.equal(g3.isFull(b), true);
  assert.equal(g3.winner(b), null);
  assert.equal(g3.status(b).state, 'draw');
});

test('illegal moves are rejected', () => {
  const b = boardOf(g3, { 0: CAT });
  assert.equal(g3.isLegal(b, 0), false);
  assert.equal(g3.isLegal(b, -1), false);
  assert.equal(g3.isLegal(b, 9), false);
  assert.equal(g3.isLegal(b, 1), true);
});

test('challenge AI wins immediately when it can, else blocks', () => {
  assert.equal(g3.computerMove(boardOf(g3, { 0: DOG, 1: DOG, 3: CAT, 4: CAT }), DOG, 'challenge'), 2);
  assert.equal(g3.computerMove(boardOf(g3, { 0: CAT, 1: CAT, 3: DOG }), DOG, 'challenge'), 2);
});

test('challenge AI works on 4×4 four-in-a-row', () => {
  assert.equal(g4.computerMove(boardOf(g4, { 0: DOG, 1: DOG, 2: DOG }), DOG, 'challenge'), 3);
  assert.equal(g4.computerMove(boardOf(g4, { 0: CAT, 1: CAT, 2: CAT }), DOG, 'challenge'), 3);
});

test('easy AI always picks a legal empty cell', () => {
  const b = boardOf(g4, { 0: CAT, 5: DOG });
  for (let k = 0; k < 50; k++) {
    assert.ok(g4.isLegal(b, g4.computerMove(b, DOG, 'easy')));
  }
});

test('hint prefers winning move, then block, then center/corner', () => {
  assert.equal(g3.hint(boardOf(g3, { 0: CAT, 1: CAT }), CAT), 2);
  assert.equal(g3.hint(boardOf(g3, { 0: DOG, 1: DOG }), CAT), 2);
  assert.equal(g3.hint(boardOf(g3), CAT), 4);
});

test('winLines counts match expected for each size/winLength', () => {
  assert.equal(winLines(3, 3).length, 8);
  assert.equal(winLines(4, 4).length, 10);
  assert.equal(winLines(5, 5).length, 12);
  assert.equal(winLines(4, 3).length, 24);
  assert.equal(winLines(5, 3).length, 48);
});

test('no two win lines are identical, and every index is in range', () => {
  for (const [size, win] of [[3, 3], [4, 4], [4, 3], [5, 5], [5, 4]]) {
    const lines = winLines(size, win);
    const seen = new Set(lines.map((l) => l.join(',')));
    assert.equal(seen.size, lines.length);
    for (const l of lines) {
      assert.equal(l.length, win);
      for (const i of l) assert.ok(i >= 0 && i < size * size);
    }
  }
});
