export const DIFFICULTIES = { easy: { label: '小小挑战', pairs: 3 }, medium: { label: '再多一点', pairs: 4 }, hard: { label: '大大挑战', pairs: 6 } };

export function shuffle(items, random = Math.random) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export function createDeck(images, pairs, random = Math.random) {
  if (!Array.isArray(images) || images.length < pairs) throw new Error('图片数量不够');
  const selected = shuffle(images, random).slice(0, pairs);
  return shuffle(selected.flatMap((image, pairIndex) => [0, 1].map(copy => ({ cardId: `${image.id}-${copy}`, pairId: image.id, image, pairIndex, state: 'down' }))), random);
}

export function canFlip(deck, chosen, index, locked) { return !locked && chosen.length < 2 && Number.isInteger(index) && deck[index]?.state === 'down'; }

export function compare(deck, [a, b]) { return a !== b && deck[a]?.pairId === deck[b]?.pairId; }
