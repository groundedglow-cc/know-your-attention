// Generate the bundled Japanese vocabulary audio for 翻翻找朋友.
// Required env: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION. Credentials are never logged.
import { existsSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const region = String(process.env.AZURE_SPEECH_REGION || '').trim().toLowerCase().replace(/\s+/g, '');
const key = process.env.AZURE_SPEECH_KEY;
const voice = process.env.AZURE_TTS_VOICE_ID || 'ja-JP-NanamiNeural';
if (!key || !region) throw new Error('Missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION. No Azure request was sent.');
if (!/^ja-JP-[A-Za-z]+Neural$/.test(voice)) throw new Error('Expected a Japanese Azure Neural voice.');

const words = [
  ['neko', 'ねこ'], ['inu', 'いぬ'], ['usagi', 'うさぎ'], ['zou', 'ぞう'], ['panda', 'パンダ'], ['pengin', 'ペンギン'],
  ['kuruma', 'くるま'], ['basu', 'バス'], ['densha', 'でんしゃ'], ['hikouki', 'ひこうき'], ['fune', 'ふね'], ['shoberukaa', 'ショベルカー'],
  ['ringo', 'りんご'], ['banana', 'バナナ'], ['ichigo', 'いちご'], ['budou', 'ぶどう'], ['suika', 'すいか'], ['orenji', 'オレンジ'],
  ['praise-sugoi', 'すごい！'], ['praise-iine', 'いいね！'], ['praise-jouzu', 'じょうず！'],
];
const folder = 'public/game/memory/audio';
const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
await mkdir(folder, { recursive: true });
for (const [id, text] of words) {
  const path = join(folder, `${id}.mp3`);
  if (existsSync(path)) { console.log(`Cached: ${id}`); continue; }
  const ssml = `<speak version="1.0" xml:lang="ja-JP"><voice name="${voice}">${text}</voice></speak>`;
  let response;
  try { response = await fetch(endpoint, { method: 'POST', signal: AbortSignal.timeout(60000), headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-160kbitrate-mono-mp3', 'User-Agent': 'memory-match-azure-audio' }, body: ssml }); }
  catch { throw new Error(`Azure request failed for ${id}; credentials were not printed.`); }
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  const mp3 = buffer.subarray(0, 3).toString() === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
  if (!response.ok || buffer.length < 1000 || !mp3 || /json|html|text\//.test(contentType)) throw new Error(`Azure returned invalid audio for ${id} (HTTP ${response.status}).`);
  await writeFile(`${path}.tmp`, buffer); await rename(`${path}.tmp`, path);
  console.log(`Generated: ${id}`);
}
console.log(`Ready: ${words.length} Japanese word files; voice=${voice}`);
