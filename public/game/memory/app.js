import { builtInThemes } from './cards.js?v=3';
import { DIFFICULTIES, createDeck, canFlip, compare } from './engine.js?v=3';
import { createSounds } from './sound.js?v=3';
const $ = s => document.querySelector(s);
const blockedCardStyle = document.createElement('style'); blockedCardStyle.textContent = '.card.is-blocked{filter:grayscale(1);opacity:.38;cursor:not-allowed;transform:none}.card.is-blocked:active{transform:none}.front{display:flex!important;flex-direction:column!important;justify-content:center!important;gap:2px!important}.front img{width:100%;height:70%;padding:3% 7% 0!important;object-fit:contain}.card-caption{display:flex;flex-direction:column;align-items:center;line-height:1.05;padding:0 4px 5px;max-width:100%;overflow:hidden}.card-caption strong{font-size:clamp(.63rem,1.5vw,.86rem);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.card-caption small{font-size:clamp(.55rem,1.25vw,.72rem);color:#806c61;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}'; document.head.append(blockedCardStyle);
const storageKey = 'memory-match-settings-v1';
let prefs = { theme: 'animals', difficulty: 'easy', delay: 1800, language: 'ja' };
try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem(storageKey)) }; } catch {}
const sounds = createSounds(localStorage);
let themes = { ...builtInThemes }, deck = [], chosen = [], locked = false, timer = 0, dueAt = 0, pausedLeft = 0, completed = 0, completedOnce = false, gameVersion = 0;
const ossAudio = id => `https://japaflow-audio-bucket.oss-cn-shanghai.aliyuncs.com/memory-match/audio/${id}.mp3`;
const praise = [
  { japanese: 'すごい！', chinese: '太棒啦！', english: 'Great!', audio: { ja: ossAudio('praise-sugoi'), en: ossAudio('praise-great-en') } },
  { japanese: 'いいね！', chinese: '真不错！', english: 'Nice!', audio: { ja: ossAudio('praise-iine'), en: ossAudio('praise-nice-en') } },
  { japanese: 'じょうず！', chinese: '做得好！', english: 'Well done!', audio: { ja: ossAudio('praise-jouzu'), en: ossAudio('praise-welldone-en') } },
];

function savePrefs() { try { localStorage.setItem(storageKey, JSON.stringify(prefs)); } catch {} }
function setSoundButtons() { document.querySelectorAll('[data-sound]').forEach(b => { b.style.position = 'static'; b.textContent = sounds.enabled ? '🔊' : '🔇'; b.setAttribute('aria-label', sounds.enabled ? '关闭音效' : '开启音效'); }); }
function setLanguageButtons() { document.querySelectorAll('[data-language]').forEach(b => { const english = prefs.language === 'en'; b.textContent = english ? 'English' : '日语'; b.setAttribute('aria-pressed', String(english)); b.setAttribute('aria-label', english ? '当前朗读英文，点击切换到日语' : '当前朗读日语，点击切换到英文'); }); }
const difficultyLabels = { easy: '6 张', medium: '8 张', hard: '12 张' };
const builtInDescriptions = { animals: '认识可爱动物', vehicles: '一起出发旅行', fruits: '认识颜色和味道' };
function difficultyButtons(target) { return Object.entries(difficultyLabels).map(([id,label]) => `<button type="button" data-difficulty="${id}" aria-pressed="${prefs.difficulty === id}">${label}</button>`).join(''); }
function renderDifficultyButtons() { $('#home-difficulty').innerHTML = difficultyButtons('home'); $('#game-difficulty').innerHTML = difficultyButtons('game'); }
function renderSeriesGrid() {
  const grid = $('#series-grid');
  if (!grid) return;
  const entries = Object.entries(themes);
  grid.innerHTML = entries.map(([id, theme], index) => {
    const image = theme.images?.[0];
    const number = theme.custom ? '我的' : String(index + 1).padStart(2, '0');
    const description = theme.custom ? '本地图片主题' : (builtInDescriptions[id] || '发现新的词语');
    return `<button class="series-card" type="button" data-series="${id}" aria-label="系列 ${number}，${theme.name}"><img src="${image?.src || ''}" alt=""><strong>${theme.name}</strong><small><span class="series-number">系列 ${number}</span> · ${description}</small></button>`;
  }).join('');
  renderDifficultyButtons();
}
function populateThemes() { if (!themes[prefs.theme]) prefs.theme = 'animals'; renderSeriesGrid(); }
function currentTheme() { return themes[prefs.theme] || themes.animals; }
function clearTimer() { clearTimeout(timer); timer = 0; dueAt = 0; pausedLeft = 0; }
function cardLabel(card, index) { const ordinal = `第 ${index + 1} 张卡片`, word = prefs.language === 'en' ? card.image.english : card.image.japanese; return card.state === 'down' ? `${ordinal}，未翻开` : `${ordinal}，${card.image.name}${word ? `，${prefs.language === 'en' ? '英文' : '日语'} ${word}` : ''}${card.state === 'matched' ? '，已配对' : ''}`; }
function cols(count) { return count === 6 ? 3 : count === 8 ? 2 : 3; }
function fitBoardToViewport() {
  const board = $('#board');
  if (!board || window.innerWidth < 600 || !deck.length) { if (board) board.style.width = ''; return; }
  // Keep every card visible on iPad: solve the grid height from the actual
  // header, status and action heights instead of guessing a fixed viewport %.
  const wideColumns = deck.length === 8 || deck.length === 12 ? 4 : 3;
  const rows = Math.ceil(deck.length / wideColumns);
  const gap = Number.parseFloat(getComputedStyle(board).gap) || 18;
  const cardRatio = 1.12;
  const viewport = window.visualViewport?.height || window.innerHeight;
  const reserved = $('header').offsetHeight + $('#status').offsetHeight + $('.game-actions').offsetHeight + 58;
  const usableHeight = Math.max(250, viewport - reserved);
  const heightLimitedWidth = ((usableHeight - gap * (rows - 1)) * wideColumns / (rows * cardRatio)) + gap * (wideColumns - 1);
  const horizontalWidth = $('#game').clientWidth - 32;
  board.style.width = `${Math.max(320, Math.min(680, horizontalWidth, heightLimitedWidth))}px`;
}
function render() {
  const board = $('#board'); const theme = currentTheme(); board.dataset.count = String(deck.length); board.style.setProperty('--cols', cols(deck.length)); board.style.setProperty('--back', theme.back);
  board.innerHTML = deck.map((card,index) => { const word = prefs.language === 'en' ? card.image.english : card.image.japanese; return `<button class="card ${card.state === 'up' ? 'is-up' : ''} ${card.state === 'matched' ? 'is-matched' : ''} ${locked && card.state === 'down' ? 'is-blocked' : ''}" data-index="${index}" aria-label="${cardLabel(card,index)}" ${card.state !== 'down' || locked ? 'aria-disabled="true"' : ''}><span class="face back" aria-hidden="true"></span><span class="face front"><img src="${card.image.src}" alt="${card.image.name}"><span class="card-caption"><strong>${word || ''}</strong><small>${card.image.name}</small></span>${card.state === 'matched' ? '<b class="matched-mark" aria-hidden="true">✓</b>' : ''}</span></button>`; }).join('');
  const pairCount = DIFFICULTIES[prefs.difficulty].pairs; $('#progress').innerHTML = Array.from({length:pairCount},(_,i)=>`<span class="star ${i < completed ? 'done' : ''}" aria-label="${i < completed ? '已找到一对' : '还没找到的一对'}">★</span>`).join('');
  $('#series-title').textContent = theme.name; $('#series-number').textContent = theme.custom ? '我的系列' : `系列 ${String(Object.keys(themes).indexOf(prefs.theme) + 1).padStart(2, '0')}`;
  renderDifficultyButtons();
  $('#peek').disabled = locked || chosen.length > 0 || completed === pairCount;
  requestAnimationFrame(fitBoardToViewport);
}
function say(s) { $('#status').textContent = s; }
function waitForNarrationCue(wordDone) { return Promise.race([Promise.resolve(wordDone), new Promise(resolve => setTimeout(resolve, 650))]); }
function begin() { gameVersion++; clearTimer(); completed = 0; completedOnce = false; chosen = []; locked = false; try { deck = createDeck(currentTheme().images, DIFFICULTIES[prefs.difficulty].pairs); } catch (e) { say(e.message); return; } $('#complete').hidden = true; render(); say('翻两张，找一样的！'); }
function finish() { if (completedOnce) return; completedOnce = true; clearTimer(); $('#complete').hidden = false; say('都找到啦！'); sounds.play('win'); }
function resolveChoice(wordDone) { const [a,b] = chosen; if (compare(deck, chosen)) { const cheer = praise[Math.floor(Math.random() * praise.length)], version = gameVersion, language = prefs.language; deck[a].state = deck[b].state = 'matched'; completed++; const lastPair = completed === DIFFICULTIES[prefs.difficulty].pairs; chosen=[]; locked=false; render(); Promise.resolve(wordDone).then(async () => { if (version !== gameVersion) return; if (!sounds.enabled) { if (lastPair) finish(); return; } sounds.play('match'); say(language === 'en' ? `${cheer.english} · ${cheer.chinese}` : `${cheer.japanese} · ${cheer.chinese}`); if (version !== gameVersion) return; await sounds.speak(cheer.audio[language]); if (version !== gameVersion || !lastPair) return; finish(); }); return; }
  say('再找找。'); dueAt = Date.now() + Number(prefs.delay); timer = setTimeout(() => { deck[a].state=deck[b].state='down'; chosen=[];locked=false;render();say('再翻两张看看。'); }, Number(prefs.delay));
}
function flip(index) { if (!canFlip(deck, chosen, index, locked)) return; const card = deck[index], word = prefs.language === 'en' ? card.image.english : card.image.japanese; sounds.play('flip'); const wordDone = waitForNarrationCue(sounds.speak(card.image.audio?.[prefs.language])); deck[index].state = 'up'; chosen.push(index); render(); say(word ? `${word} · ${card.image.name}` : card.image.name); if (chosen.length === 2) { locked = true; render(); resolveChoice(wordDone); } }
function showScreen(game) { $('#home').hidden = game; $('#game').hidden = !game; if (!game) { clearTimer(); renderSeriesGrid(); } }
function imageToData(file) { return new Promise((resolve,reject) => { if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('只支持 JPEG、PNG 或 WebP 图片。')); const reader=new FileReader(); reader.onerror=()=>reject(new Error('图片读取失败，请换一张试试。')); reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error('图片无法解码。'));image.onload=()=>{const scale=Math.min(1,512/Math.max(image.width,image.height));const c=document.createElement('canvas');c.width=Math.round(image.width*scale);c.height=Math.round(image.height*scale);c.getContext('2d').drawImage(image,0,0,c.width,c.height);resolve(c.toDataURL('image/webp',.86));};image.src=reader.result;};reader.readAsDataURL(file); }); }
const db = (() => { let open; const get=()=>open ||= new Promise((resolve,reject)=>{const r=indexedDB.open('memory-match',1);r.onupgradeneeded=()=>r.result.createObjectStore('themes',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}); return { async all(){const d=await get();return new Promise((res,rej)=>{const r=d.transaction('themes').objectStore('themes').getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});},async put(x){const d=await get();return new Promise((res,rej)=>{const r=d.transaction('themes','readwrite').objectStore('themes').put(x);r.onsuccess=res;r.onerror=()=>rej(r.error);});},async del(id){const d=await get();return new Promise((res,rej)=>{const r=d.transaction('themes','readwrite').objectStore('themes').delete(id);r.onsuccess=res;r.onerror=()=>rej(r.error);});} }; })();
async function renderCustomList() { const box=$('#custom-list'); const customs=Object.values(themes).filter(t=>t.custom); box.innerHTML=customs.map(t=>`<div class="custom-row"><span>${t.name}（${t.images.length} 张）</span><button data-delete="${t.id}">删除</button></div>`).join(''); }
async function loadCustom() { try { (await db.all()).forEach(t=>themes[t.id]=t); } catch { $('#import-message').textContent='这台设备不能保存自定义主题。'; } populateThemes(); renderCustomList(); }

function startSeries(id) { if (!themes[id]) return; prefs.theme = id; savePrefs(); sounds.play('flip'); showScreen(true); begin(); }
function changeDifficulty(next) {
  if (!DIFFICULTIES[next] || next === prefs.difficulty) return;
  const inGame = !$('#game').hidden && deck.length > 0 && !completedOnce;
  if (inGame && !confirm('切换卡片数量会重新开始这一组，确定吗？')) { renderDifficultyButtons(); return; }
  prefs.difficulty = next; savePrefs();
  if (inGame || !$('#game').hidden) begin(); else renderDifficultyButtons();
}
$('#back').onclick=()=>{ gameVersion++; clearTimer(); deck=[]; chosen=[]; showScreen(false); };
$('#again').onclick=begin; $('#change').onclick=()=>{ gameVersion++; deck=[]; showScreen(false); };
$('#series-grid').onclick=e=>{ const card=e.target.closest('[data-series]'); if (card) startSeries(card.dataset.series); };
document.addEventListener('click', e=>{ const button=e.target.closest('[data-difficulty]'); if (button) changeDifficulty(button.dataset.difficulty); });
document.querySelectorAll('[data-sound]').forEach(b=>b.onclick=()=>{sounds.toggle();setSoundButtons();}); document.querySelectorAll('[data-language]').forEach(b=>b.onclick=()=>{prefs.language = prefs.language === 'ja' ? 'en' : 'ja'; savePrefs(); setLanguageButtons(); render();});
$('#board').addEventListener('click',e=>{const card=e.target.closest('[data-index]');if(card)flip(Number(card.dataset.index));});
$('#peek').onclick=()=>{if(locked||chosen.length)return;locked=true;deck.forEach(c=>{if(c.state==='down')c.state='up';});render();say('看一眼所有卡片。');setTimeout(()=>{deck.forEach(c=>{if(c.state==='up')c.state='down';});locked=false;render();say('准备好啦，慢慢找。');},2000);};
$('#parent').onclick=()=>{document.querySelector(`input[name=delay][value="${prefs.delay}"]`).checked=true;renderCustomList();$('#settings').showModal();}; $('#tutorial').onclick=()=>$('#learn').showModal(); $('#learn-start').onclick=()=>{$('#learn').close();startSeries(prefs.theme);}; document.querySelectorAll('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('input[name=delay]').forEach(r=>r.onchange=e=>{prefs.delay=Number(e.target.value);savePrefs();});
$('#save-custom').onclick=async()=>{const files=[...$('#custom-files').files], name=$('#custom-name').value.trim()||'我的主题', msg=$('#import-message'); if(files.length<3||files.length>12){msg.textContent='请选 3 到 12 张不同图片。';return;}msg.textContent='正在准备图片…';try{const images=await Promise.all(files.map(async(f,i)=>({id:`custom-${Date.now()}-${i}`,name:`图片 ${i+1}`,src:await imageToData(f)})));const theme={id:`custom-${Date.now()}`,name,images,back:'#bd9dd1',custom:true};await db.put(theme);themes[theme.id]=theme;prefs.theme=theme.id;savePrefs();populateThemes();renderCustomList();msg.textContent='保存好了！';}catch(e){msg.textContent=e.message||'保存失败，可能是储存空间不足。';}};
$('#custom-list').onclick=async e=>{const id=e.target.dataset.delete;if(!id||!confirm('删除这个自定义主题吗？'))return;try{await db.del(id);delete themes[id];if(prefs.theme===id)prefs.theme='animals';savePrefs();populateThemes();renderCustomList();}catch{$('#import-message').textContent='删除失败，请稍后再试。';}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&timer){pausedLeft=Math.max(0,dueAt-Date.now());clearTimeout(timer);timer=0;}else if(!document.hidden&&pausedLeft&&chosen.length===2){const left=pausedLeft;pausedLeft=0;dueAt=Date.now()+left;timer=setTimeout(()=>{const[a,b]=chosen;deck[a].state=deck[b].state='down';chosen=[];locked=false;render();say('再翻两张看看。');},left);}}); window.addEventListener('resize', fitBoardToViewport); window.visualViewport?.addEventListener('resize', fitBoardToViewport);
setSoundButtons(); setLanguageButtons(); loadCustom(); if(!localStorage.getItem('memory-tutorial-seen')) { try { localStorage.setItem('memory-tutorial-seen','1'); setTimeout(()=>$('#learn').showModal(),150); } catch {} }
