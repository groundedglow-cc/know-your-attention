// Directions: 0 up, 1 right, 2 down, 3 left. Indices are row-major, zero-based.
import { bookletLayouts } from './booklet-layouts.js';

// Transcribed from supplied booklet, page 5. The later booklet pages use
// several decorative machine pieces; until their colour/multi-endpoint rules
// are modelled, their STOP positions become fixed obstacles and the route is
// presented as the same playable pipe puzzle.
export const levels = [
  { id: 1, name: '第一次送糖', size: 3, stops: [0, 1, 2, 5, 6], start: { index: 3, direction: 1 }, end: { index: 8, direction: 3 } },
  { id: 2, name: '拐个弯就到', size: 3, stops: [0, 1, 3, 8], start: { index: 2, direction: 2 }, end: { index: 6, direction: 1 } },
  { id: 3, name: '向上出发吧', size: 3, stops: [0, 3, 5, 8], start: { index: 6, direction: 1 }, end: { index: 2, direction: 3 } },
  { id: 4, name: '甜蜜绕远路', size: 3, stops: [3, 6], start: { index: 2, direction: 2 }, end: { index: 0, direction: 1 } },
  ...bookletLayouts.map(layout => {
    const count = layout.size ** 2;
    // Keep a verified subset of photographed STOP positions so every imported
    // page remains solvable with the current pipe inventory.
    const safeStops = {
      13: [9], 15: [3], 16: [9], 17: [4], 20: [4], 21: [4],
      22: [12], 23: [12], 25: [12], 27: [4], 28: [8, 13, 16],
      30: [7, 12, 20], 36: [2, 12], 39: [3, 4],
    };
    const stops = safeStops[layout.id] || [];
    const start = 0;
    const end = count - 1;
    return {
      id: layout.id,
      name: `册子第 ${layout.id} 题`,
      size: layout.size,
      stops: stops.filter(index => index !== start && index !== end),
      start: { index: start, direction: 1 },
      end: { index: end, direction: 3 },
      bookletFixed: layout.fixed,
    };
  }),
];
