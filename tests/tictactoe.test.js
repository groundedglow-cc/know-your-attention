import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAT, DOG, CELLS, WIN_LINES,
  status, winner, isFull, isLegal, emptyCells, computerMove, hint,
} from '../public/game/tictactoe/engine.js';

const board = () => Array(CELLS).fill(null);

test('win detection: rows, columns, and both diagonals', () => {
  assert.deepEqual(winner([CAT, CAT, CAT, null, null, null, null, null, null]), { player: CAT, line: [0, 1, 2] });
  assert.deepEqual(winner([DOG, null, null, DOG, null, null, DOG, null, null]), { player: DOG, line: [0, 3, 6] });
  assert.deepEqual(winner([CAT, null, null, null, CAT, null, null, null, CAT]), { player: CAT, line: [0, 4, 8] });
  assert.deepEqual(winner([null, null, CAT, null, CAT, null, CAT, null, null]), { player: CAT, line: [2, 4, 6] });
  assert.equal(winner(board()), null);
});

test('last cell that both fills and wins reports a win, not a draw', () => {
  const b = [CAT, DOG, CAT, DOG, CAT, DOG, DOG, CAT, null];
  assert.equal(status(b).state, 'playing');
  b[8] = CAT;
  assert.equal(isFull(b), true);
  assert.equal(status(b).state, 'won');
  assert.deepEqual(status(b).line, [0, 4, 8]);
});

test('draw when full with no winner', () => {
  const b = [CAT, CAT, DOG, DOG, DOG, CAT, CAT, DOG, CAT];
  assert.equal(isFull(b), true);
  assert.equal(winner(b), null);
  assert.equal(status(b).state, 'draw');
});

test('illegal moves are rejected', () => {
  const b = board();
  b[0] = CAT;
  assert.equal(isLegal(b, 0), false);
  assert.equal(isLegal(b, -1), false);
  assert.equal(isLegal(b, 9), false);
  assert.equal(isLegal(b, 1), true);
});

test('challenge AI wins immediately when it can', () => {
  const b = [DOG, DOG, null, CAT, CAT, null, null, null, null];
  assert.equal(computerMove(b, DOG, 'challenge'), 2);
});

test('challenge AI blocks the opponent immediate win', () => {
  const b = [CAT, CAT, null, DOG, null, null, null, null, null];
  assert.equal(computerMove(b, DOG, 'challenge'), 2);
});

test('easy AI always picks a legal empty cell', () => {
  const b = board();
  b[0] = CAT;
  b[4] = DOG;
  for (let k = 0; k < 50; k++) {
    const m = computerMove(b, DOG, 'easy');
    assert.ok(isLegal(b, m));
  }
});

test('hint prefers a winning move, then a block, then center/corner', () => {
  assert.equal(hint([CAT, CAT, null, null, null, null, null, null, null], CAT), 2);
  assert.equal(hint([DOG, DOG, null, null, null, null, null, null, null], CAT), 2);
  assert.equal(hint(board(), CAT), 4);
});

test('WIN_LINES covers every cell with eight distinct three-cell lines', () => {
  const seen = new Set();
  for (const line of WIN_LINES) {
    assert.equal(line.length, 3);
    for (const i of line) seen.add(i);
  }
  assert.equal(seen.size, CELLS);
  assert.equal(WIN_LINES.length, 8);
});

test('emptyCells lists all free cells', () => {
  const b = board();
  b[0] = CAT;
  b[8] = DOG;
  assert.deepEqual(emptyCells(b), [1, 2, 3, 4, 5, 6, 7]);
});
