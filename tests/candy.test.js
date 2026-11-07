import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../public/game/candy/levels.js';
import { solve, complete, hint, ports, fixed } from '../public/game/candy/engine.js';

function freeCells(l) { return l.size ** 2 - l.stops.length - l.belts.length * 2 - Object.keys(l.given).length; }

for (const l of levels) test(`Booklet level ${l.id} is solvable, fills every space and preserves fixed cards`, () => {
  const solution = solve(l, [], l.palette);
  assert.ok(solution, 'expected a solution within the palette');
  assert.ok(complete(l, solution), 'solution must satisfy complete()');
  assert.equal(solution.filter(Boolean).length, freeCells(l), 'fills exactly the free cells');
  solution.forEach((tile, i) => { if (fixed(l, i)) assert.equal(tile, null); });
  // Removing one placed tile makes it incomplete, and the hint points back to it.
  const i = solution.findIndex((t, idx) => t && !fixed(l, idx));
  const missing = [...solution]; missing[i] = null;
  assert.equal(complete(l, missing), false);
  assert.equal(hint(l, missing).index, i);
  assert.equal(hint(l, missing).error, false);
});

test('Booklet endpoints and STOP positions are transcribed exactly for the first four levels', () => {
  assert.deepEqual(levels.slice(0, 4).map(l => [l.stops, l.belts[0].start.index, l.belts[0].start.direction, l.belts[0].end.index, l.belts[0].end.direction]), [
    [[0, 1, 2, 5, 6], 8, 3, 3, 1], [[0, 1, 3, 8], 6, 1, 2, 2], [[0, 3, 5, 8], 2, 3, 6, 1], [[3, 6], 0, 1, 2, 2]]);
});

test('Rotation and empty boards', () => {
  assert.deepEqual(ports({ kind: 'corner', rotation: 3 }), [0, 3]);
  assert.deepEqual(ports({ kind: 'straight', rotation: 1 }), [1, 3]);
  for (const l of levels) {
    assert.equal(complete(l, Array(l.size ** 2).fill(null)), false);
  }
});

test('Start at first unfinished level, even if later levels were completed; all done falls back to first', async () => {
  const { firstUnfinished } = await import('../public/game/candy/progress.js');
  assert.equal(firstUnfinished(levels, new Set()), 0);
  assert.equal(firstUnfinished(levels, new Set([1, 3])), 1);
  assert.equal(firstUnfinished(levels, new Set([1, 2, 3])), 3);
  assert.equal(firstUnfinished(levels, new Set(levels.map(l => l.id))), 0);
});

test('Reset or undo removes completion; restoring a solved board earns it again', async () => {
  const { syncCompletion, firstUnfinished } = await import('../public/game/candy/progress.js');
  const completed = new Set([1, 2]);
  syncCompletion(completed, 1, false);
  assert.deepEqual([...completed], [2]); assert.equal(firstUnfinished(levels, completed), 0);
  syncCompletion(completed, 1, true); assert.ok(completed.has(1));
  syncCompletion(completed, 1, false); assert.ok(!completed.has(1));
});

test('4×4 fixture has a valid full-board route', () => {
  const fixture = { id: 1, name: '4×4 QA', size: 4, stops: [], belts: [{ color: 'blue', start: { index: 0, direction: 1 }, end: { index: 12, direction: 1 } }], given: {} };
  const solution = solve(fixture);
  assert.ok(solution); assert.equal(solution.length, 16); assert.ok(complete(fixture, solution));
});
