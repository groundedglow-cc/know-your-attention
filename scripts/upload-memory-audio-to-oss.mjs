// Upload only the bundled 翻翻找朋友 Japanese word MP3s to OSS.
// Required env: OSS_ENABLED=true, OSS_REGION, OSS_ACCESS_KEY_ID,
// OSS_ACCESS_KEY_SECRET, OSS_BUCKET, OSS_BASE_URL. None are logged.
import OSS from 'ali-oss';
import { readdir, readFile } from 'node:fs/promises';

const required = ['OSS_REGION', 'OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET', 'OSS_BUCKET', 'OSS_BASE_URL'];
if (process.env.OSS_ENABLED !== 'true' || required.some(key => !process.env[key])) throw new Error('Missing OSS configuration. No files were uploaded.');
const baseUrl = process.env.OSS_BASE_URL.replace(/\/+$/, '');
const client = new OSS({ region: process.env.OSS_REGION, accessKeyId: process.env.OSS_ACCESS_KEY_ID, accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET, bucket: process.env.OSS_BUCKET });
const files = (await readdir('public/game/memory/audio')).filter(name => name.endsWith('.mp3')).sort();
if (files.length !== 42) throw new Error(`Expected 42 MP3 files, found ${files.length}. No files were uploaded.`);
let uploaded = 0, skipped = 0;
for (const name of files) {
  const key = `memory-match/audio/${name}`;
  try { await client.head(key); skipped++; console.log(`Cached: ${key}`); continue; } catch (error) { if (error?.code !== 'NoSuchKey' && error?.status !== 404) throw error; }
  await client.put(key, await readFile(`public/game/memory/audio/${name}`), { mime: 'audio/mpeg', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } });
  uploaded++; console.log(`Uploaded: ${key}`);
}
console.log(`Ready: uploaded=${uploaded} cached=${skipped} public=${baseUrl}/memory-match/audio/`);
