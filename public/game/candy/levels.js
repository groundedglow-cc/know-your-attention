// Directions: 0 up, 1 right, 2 down, 3 left. Indices are row-major, zero-based.
// Transcribed from supplied booklet, page 5. Only these four layouts were supplied.
export const levels = [
  { id: 1, name: '第一次送糖', size: 3, stops: [0, 1, 2, 5, 6], start: { index: 3, direction: 1 }, end: { index: 8, direction: 3 } },
  { id: 2, name: '拐个弯就到', size: 3, stops: [0, 1, 3, 8], start: { index: 2, direction: 2 }, end: { index: 6, direction: 1 } },
  { id: 3, name: '向上出发吧', size: 3, stops: [0, 3, 5, 8], start: { index: 6, direction: 1 }, end: { index: 2, direction: 3 } },
  { id: 4, name: '甜蜜绕远路', size: 3, stops: [3, 6], start: { index: 2, direction: 2 }, end: { index: 0, direction: 1 } },
];
