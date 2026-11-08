import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { builtInThemes } from '../public/game/memory/cards.js';

test('every built-in card has Japanese and English local source audio', () => {
  const cards = Object.values(builtInThemes).flatMap(theme => theme.images);
  assert.equal(cards.length, 280);
  for (const card of cards) {
    assert.ok(card.english, `${card.id} is missing its English word`);
    for (const language of ['ja', 'en']) {
      const url = card.audio?.[language];
      assert.match(url || '', /^https:\/\/japaflow-audio-bucket\.oss-cn-shanghai\.aliyuncs\.com\/memory-match\/audio\/.+\.mp3$/);
      assert.ok(existsSync(join('public/game/memory/audio', basename(url))), `${card.id} is missing ${language} source audio`);
    }
  }
});

test('the complete bilingual set and 6 praise clips exist', () => {
  const expected = 280 * 2 + 6;
  assert.ok(readdirSync('public/game/memory/audio').filter(file => file.endsWith('.mp3')).length >= expected);
});
