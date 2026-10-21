import test from 'node:test';
import assert from 'node:assert/strict';
import { bookletLayouts } from '../public/game/candy/booklet-layouts.js';

test('supplied later booklet pages are cataloged as 35 layouts from questions 5 through 39', () => {
 assert.equal(bookletLayouts.length,35);
 assert.deepEqual(bookletLayouts.map(layout=>layout.id),Array.from({length:35},(_,i)=>i+5));
 assert.deepEqual([...new Set(bookletLayouts.map(layout=>layout.size))],[3,4,5]);
 for (const layout of bookletLayouts) {
  const cellCount=layout.size**2;
  for (const index of Object.keys(layout.fixed)) assert.ok(Number(index)>=0&&Number(index)<cellCount);
 }
});
