import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../public/game/candy/levels.js';

test('candy booklet cataloged as 39 levels (1–4 authored, 5–39 transcribed)', () => {
  assert.equal(levels.length, 39);
  assert.deepEqual(levels.map(l => l.id), Array.from({ length: 39 }, (_, i) => i + 1));
  assert.deepEqual([...new Set(levels.map(l => l.size))], [3, 4, 5]);
});

test('every level has valid cells, givens and palette', () => {
  for (const l of levels) {
    const count = l.size ** 2;
    for (const idx of l.stops) assert.ok(idx >= 0 && idx < count, `stop ${idx} in range`);
    for (const b of l.belts) {
      assert.ok(['blue', 'yellow'].includes(b.color));
      for (const p of [b.start, b.end]) {
        assert.ok(p.index >= 0 && p.index < count, `endpoint ${p.index} in range`);
        assert.ok(p.direction >= 0 && p.direction < 4);
      }
    }
    for (const [idxStr, g] of Object.entries(l.given)) {
      const idx = Number(idxStr);
      assert.ok(idx >= 0 && idx < count, `given ${idx} in range`);
      if (g.kind === 'shared') {
        assert.ok(g.rotation === 0 || g.rotation === 1);
      } else if (g.kind === 'shared-corner') {
        assert.ok(g.rotation >= 0 && g.rotation < 4);
      } else {
        assert.ok(['straight', 'corner', 'cross'].includes(g.kind));
        assert.ok(['blue', 'yellow'].includes(g.color));
      }
    }
    // Palette totals must equal the number of cells the player has to fill.
    const paletteTotal = Object.values(l.palette).reduce((a, b) => a + b, 0);
    const free = count - l.stops.length - l.belts.length * 2 - Object.keys(l.given).length;
    assert.equal(paletteTotal, free, `level ${l.id} palette total ${paletteTotal} != free ${free}`);
  }
});
