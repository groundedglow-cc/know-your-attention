import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, createDeck, canFlip, compare } from '../public/game/memory/engine.js';

const images = [{ id: 'cat', name: '小猫' }, { id: 'dog', name: '小狗' }, { id: 'rabbit', name: '小兔子' }, { id: 'panda', name: '熊猫' }];

test('deck has exactly two cards for every selected picture', () => {
  const deck = createDeck(images, 3, () => .1);
  assert.equal(deck.length, 6);
  for (const id of new Set(deck.map(c => c.pairId))) assert.equal(deck.filter(c => c.pairId === id).length, 2);
  assert.equal(new Set(deck.map(c => c.cardId)).size, 6);
});

test('deck needs distinct source images and uses Fisher–Yates output', () => {
  assert.throws(() => createDeck(images.slice(0, 2), 3), /数量不够/);
  assert.deepEqual(shuffle([1, 2, 3], () => 0), [2, 3, 1]);
});

test('only down cards can flip and comparison cannot match a card with itself', () => {
  const deck = createDeck(images, 3, () => .4);
  assert.equal(canFlip(deck, [], 0, false), true);
  deck[0].state = 'up';
  assert.equal(canFlip(deck, [0], 0, false), false);
  assert.equal(canFlip(deck, [0, 1], 2, false), false);
  assert.equal(canFlip(deck, [], 1, true), false);
  assert.equal(compare(deck, [0, 0]), false);
});
