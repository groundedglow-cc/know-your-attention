// Generate bundled Japanese and English vocabulary audio. Required env:
// AZURE_SPEECH_KEY and AZURE_SPEECH_REGION; credentials are never logged.
import { existsSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const region = String(process.env.AZURE_SPEECH_REGION || '').trim().toLowerCase().replace(/\s+/g, '');
const key = process.env.AZURE_SPEECH_KEY;
const jaVoice = process.env.AZURE_TTS_VOICE_ID || 'ja-JP-NanamiNeural';
const enVoice = process.env.AZURE_EN_TTS_VOICE_ID || 'en-US-JennyNeural';
if (!key || !region) throw new Error('Missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION. No Azure request was sent.');
if (!/^ja-JP-[A-Za-z]+Neural$/.test(jaVoice) || !/^en-US-[A-Za-z]+Neural$/.test(enVoice)) throw new Error('Expected Japanese and US English Azure Neural voices.');
const japanese = [['neko','ねこ'],['inu','いぬ'],['usagi','うさぎ'],['zou','ぞう'],['panda','パンダ'],['pengin','ペンギン'],['kuruma','くるま'],['basu','バス'],['densha','でんしゃ'],['hikouki','ひこうき'],['fune','ふね'],['shoberukaa','ショベルカー'],['ringo','りんご'],['banana','バナナ'],['ichigo','いちご'],['budou','ぶどう'],['suika','すいか'],['orenji','オレンジ'],['praise-sugoi','すごい！'],['praise-iine','いいね！'],['praise-jouzu','じょうず！']];
const english = [['neko','Cat'],['inu','Dog'],['usagi','Rabbit'],['zou','Elephant'],['panda','Panda'],['pengin','Penguin'],['kuruma','Car'],['basu','Bus'],['densha','Train'],['hikouki','Airplane'],['fune','Ship'],['shoberukaa','Excavator'],['ringo','Apple'],['banana','Banana'],['ichigo','Strawberry'],['budou','Grapes'],['suika','Watermelon'],['orenji','Orange'],['praise-great','Great!'],['praise-nice','Nice!'],['praise-welldone','Well done!']].map(([id,text]) => [`${id}-en`,text]);
const jobs = [...japanese.map(([id,text]) => ({ id, text, voice: jaVoice, locale: 'ja-JP' })), ...english.map(([id,text]) => ({ id, text, voice: enVoice, locale: 'en-US' }))];
const folder = 'public/game/memory/audio', endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
await mkdir(folder, { recursive: true });
for (const job of jobs) {
  const path = join(folder, `${job.id}.mp3`);
  if (existsSync(path)) { console.log(`Cached: ${job.id}`); continue; }
  const ssml = `<speak version="1.0" xml:lang="${job.locale}"><voice name="${job.voice}">${job.text}</voice></speak>`;
  let response; try { response = await fetch(endpoint, { method: 'POST', signal: AbortSignal.timeout(60000), headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-160kbitrate-mono-mp3', 'User-Agent': 'memory-match-azure-audio' }, body: ssml }); } catch { throw new Error(`Azure request failed for ${job.id}; credentials were not printed.`); }
  const buffer = Buffer.from(await response.arrayBuffer()), type = String(response.headers.get('content-type') || '').toLowerCase(), mp3 = buffer.subarray(0,3).toString() === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
  if (!response.ok || buffer.length < 1000 || !mp3 || /json|html|text\//.test(type)) throw new Error(`Azure returned invalid audio for ${job.id} (HTTP ${response.status}).`);
  await writeFile(`${path}.tmp`, buffer); await rename(`${path}.tmp`, path); console.log(`Generated: ${job.id}`);
}
console.log(`Ready: ${jobs.length} audio files; Japanese=${jaVoice}; English=${enVoice}`);
