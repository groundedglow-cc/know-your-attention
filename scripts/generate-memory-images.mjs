// Generate the 48 "入园必会" (preschool) card illustrations via the Codex
// image_gen skill (gpt-6-astra). Skips images that already exist so it can be
// resumed after a usage-limit pause. Run with: node scripts/generate-memory-images.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { preschoolSeries } from '../public/game/memory/preschool.js';

const assetsDir = join('public', 'game', 'memory', 'assets', 'preschool');
mkdirSync(assetsDir, { recursive: true });

const style = 'flat children\'s book illustration, soft pastel colors, simple rounded shapes, clean soft background, no text, no watermark, square 1:1 composition';

const jobs = [];
for (const series of preschoolSeries) {
  series.entries.forEach(([, , , prompt], index) => {
    jobs.push({ id: `${series.id}-${index + 1}`, prompt });
  });
}

let done = 0, skipped = 0, failed = 0;
for (const job of jobs) {
  const target = join(assetsDir, `${job.id}.png`);
  if (existsSync(target)) { skipped++; continue; }
  const instruction = `Generate a ${style} of this scene: ${job.prompt}. ` +
    `After generating, copy the resulting PNG file to ${target} and print the final path on its own line.`;
  try {
    const out = execFileSync('codex', ['exec', '-s', 'workspace-write', instruction], { encoding: 'utf8', timeout: 300000 });
    if (existsSync(target)) {
      done++;
      console.log(`OK   ${job.id}  (${done + skipped}/${jobs.length})`);
    } else {
      failed++;
      console.log(`MISS ${job.id}  — codex finished but file not found`);
      console.log(out.trim().split('\n').slice(-5).join('\n'));
    }
  } catch (error) {
    failed++;
    const msg = String(error.stderr || error.message || '').trim();
    console.log(`FAIL ${job.id}  ${msg.split('\n').pop()}`);
    if (/usage limit/i.test(msg)) { console.log('Usage limit reached — re-run later to resume.'); break; }
  }
}
console.log(`Done: generated=${done} skipped=${skipped} failed=${failed}`);
