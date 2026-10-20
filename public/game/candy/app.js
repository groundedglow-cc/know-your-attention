import { levels } from './levels.js?v=5d2b75a';
import { names, kinds, limits, fixed, complete, hint, ports } from './engine.js';
import { art } from './art.js';
import { buddy, basket } from './characters.js';
import { setupTutorial } from './tutorial.js';
import { createSounds } from './sound.js';
import { firstUnfinished, syncCompletion } from './progress.js';
const $ = s => document.querySelector(s);
let soundStorage;try{soundStorage=localStorage;}catch{}
const sounds=createSounds({storage:soundStorage,createContext:()=>new (window.AudioContext||window.webkitAudioContext)()});
function updateSoundButton(){const b=$('#sound-toggle');b.textContent=sounds.enabled?'🔊':'🔇';b.setAttribute('aria-pressed',String(sounds.enabled));b.setAttribute('aria-label',sounds.enabled?'关闭音效':'开启音效');}
$('#sound-toggle').onclick=()=>{sounds.toggle();updateSoundButton();};updateSoundButton();
function blocked(message){sounds.play('blocked');if(message)say(message);}
// Disabled controls still explain their state with a soft sound on pointer input.
document.addEventListener('pointerdown',e=>{if(e.target.closest('button:disabled'))sounds.play('blocked');},true);
document.addEventListener('selectstart',e=>e.preventDefault(),{passive:false});
document.addEventListener('contextmenu',e=>{if(e.target.closest('#board,#palette,#trash,#guide'))e.preventDefault();});
$('#hint-buddy').innerHTML=buddy;
$('#basket-art').innerHTML=basket;

const storageKey=document.body.dataset.storageKey || 'candy-workshop-v1';
let saved; try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch {}
let levelIndex;
let board, selected = null, history = [], hintCell = -1, hintStage = 0, visualHint = null, won = false;
const completed = new Set((saved?.completed || []).filter(id=>levels.some(l=>l.id===id)));
levelIndex=firstUnfinished(levels,completed);
const boards = saved?.boards && typeof saved.boards==='object' ? saved.boards : {};
const level = () => levels[levelIndex];
function load() {
 const l=level(), stored=boards[l.id];
 board=Array.from({length:l.size**2},(_,i)=> !fixed(l,i) && kinds.includes(stored?.[i]?.kind) && Number.isInteger(stored[i].rotation) ? {kind:stored[i].kind, rotation:((stored[i].rotation%4)+4)%4} : null);
 selected=null; history=[]; hintCell=-1; hintStage=0; visualHint=null; won=false; say('从糖果罐出发，试着接到小朋友那里。');render();revealCurrentLevel();
}
function save() { boards[level().id]=board; try { localStorage.setItem(storageKey,JSON.stringify({level:level().id,boards,completed:[...completed]})); } catch {} }
function say(message) { $('#status').textContent=message; }
function snapshot() { history.push(board.map(t=>t&&{...t})); hintCell=-1; hintStage=0; visualHint=null; }
function remaining(k) { return limits[k]-board.filter(t=>t?.kind===k).length; }
function render() {
 const l=level(), isComplete=complete(l,board);
 syncCompletion(completed,l.id,isComplete);
 const scrollPosition=$('#levels').scrollLeft;
 $('#levels').innerHTML=levels.map((v,i)=>`<button data-level="${i}" class="level ${i===levelIndex?'active':''} ${completed.has(v.id)?'completed':''}" aria-label="第 ${v.id} 关，${v.name}，${completed.has(v.id)?'已完成':i===levelIndex?'正在挑战':'未完成'}" aria-current="${i===levelIndex?'step':'false'}"><span>${completed.has(v.id)?'🏅':['🍓','🍊','🍇','🍉'][i%4]}<em>${v.id}</em></span><div>第 ${v.id} 关<small>${v.name}</small><b class="level-state">${completed.has(v.id)?'✓ 已完成':i===levelIndex?'▶ 正在挑战':'○ 未完成'}</b></div></button>`).join('');
 $('#levels').scrollLeft=scrollPosition;
 $('#previous-level').disabled=levelIndex===0;
 $('#following-level').disabled=levelIndex===levels.length-1;
 $('#completion-count').textContent=`🏅 ${completed.size} / ${levels.length}`;
 $('#level-title').textContent=`第 ${l.id} 关 · ${l.name}`;
 $('#progress').textContent=`已放好 ${board.filter(Boolean).length} / ${board.length-l.stops.length-2} 张`;
 $('#board').style.setProperty('--size',l.size);
 $('#board').dataset.size=l.size;
 $('#board').classList.toggle('success',isComplete);
 $('#columns').innerHTML=Array.from({length:l.size},(_,i)=>`<span>${i+1}</span>`).join('');
 $('#rows').innerHTML=Array.from({length:l.size},(_,i)=>`<span>${String.fromCharCode(65+i)}</span>`).join('');
 $('#board').innerHTML=board.map((tile,i)=>{
  const type=l.stops.includes(i)?'stop':i===l.start.index?'start':i===l.end.index?'end':null;
  const label=type==='stop'?'固定障碍':type==='start'?'糖果罐，固定起点':type==='end'?'小朋友，固定终点':tile?names[tile.kind]+'，连接'+ports(tile).map(d=>['上','右','下','左'][d]).join('、'):'空格';
  return `<button class="cell ${type?'fixed '+type:''} ${selected?.index===i?'selected':''} ${hintCell===i?'hinted':''}" data-cell="${i}" aria-label="${String.fromCharCode(65+Math.floor(i/l.size))}${i%l.size+1} ${label}" aria-pressed="${selected?.index===i}">${art(tile,type,type==='start'?l.start.direction:l.end.direction)}${hintCell===i?`<span class="cell-cue">${visualHint?.error?'↻':'👆'}</span>${!visualHint?.error&&hintStage>1?`<span class="hint-preview">${art(visualHint.tile)}</span>`:''}`:''}${type&&type!=='stop'?`<small>${type==='start'?'起点':'终点'}</small>`:''}</button>`;
 }).join('');
 $('#palette').innerHTML=kinds.map(kind=>`<button data-kind="${kind}" class="piece ${selected?.kind===kind&&selected.index===undefined?'selected':''}" aria-label="选择${names[kind]}" aria-pressed="${selected?.kind===kind&&selected.index===undefined}"><span class="piece-art">${art({kind,rotation:selected?.kind===kind&&selected.index===undefined?selected.rotation:0})}</span><span>${names[kind]}<small>剩余 ${remaining(kind)} 张</small></span><b>＋</b></button>`).join('');
 renderVisualHint();
 $('#trash').classList.toggle('ready',selected?.index!==undefined&&!isComplete);
 $('#undo').disabled=!history.length;
 $('#rotate').disabled=!selected || isComplete;
 $('#win').hidden=!isComplete;
 $('#next').textContent=levelIndex===levels.length-1?'再玩一次 ↻':'下一关 →';
 if(isComplete&&!won) { say('太棒了！糖果顺利到达，每个管口都接好啦！'); celebrate(); sounds.play('success'); }
 won=isComplete; save();
}
function renderVisualHint() {
 const panel=$('#visual-hint');panel.hidden=!visualHint;
 if(!visualHint)return;
 const h=visualHint;
 let illustration, caption;
 if(h.error){illustration='<span class="hint-symbol">👆</span><span class="hint-symbol spin-cue">↻</span><span class="hint-or"> / </span><span class="hint-basket">' + basket + '</span>';caption='转一转，或换一块';}
 else if(hintStage===1){illustration='<span class="hint-symbol">👀</span><span class="hint-symbol">➜</span><span class="glowing-square">👆</span>';caption='看看发光的小格子';}
 else {illustration=`<span class="hint-card">${art(h.tile)}</span><span class="hint-symbol">➜</span><span class="glowing-square">✨</span>`;caption='试试这样接';}
 panel.innerHTML=`<span class="helper-face">${buddy}</span><div class="hint-bubble"><div class="hint-pictures">${illustration}</div><strong>${caption}</strong></div>`;
 if(!h.error&&hintStage>1)$('#palette').querySelector(`[data-kind="${h.tile.kind}"]`)?.classList.add('suggested');
}
function place(source,index) {
 if(won||fixed(level(),index)) { blocked('这是题目固定的卡片，换一个空格试试吧。'); return; }
 if(board[index]) { blocked('这里已经有卡片了，可以先旋转它，或移到回收站。'); return; }
 if(source.index===undefined&&remaining(source.kind)<=0) { blocked('这种卡片用完啦。'); return; }
 snapshot(); board[index]={kind:source.kind,rotation:source.rotation};
 if(source.index!==undefined) board[source.index]=null;
 selected={...board[index],index}; say('放好啦！点一下这张卡片，就能顺时针旋转 90°。'); render();sounds.play(won?'success':'place');
}
function recycle(source=selected) {
 if(won) {blocked();return;}
 if(source?.index===undefined) { blocked('选中棋盘上的管道卡片，再放进回收站。'); return; }
 snapshot(); board[source.index]=null; selected=null; say('卡片收好啦，再试一种组合吧。'); render();sounds.play('recycle');
 const box=$('#trash');box.classList.remove('collected');void box.offsetWidth;box.classList.add('collected');
}
function revealCurrentLevel() {
 const track=$('#levels'), card=track.querySelector(`[data-level="${levelIndex}"]`);
 if(!card)return;
 const left=card.offsetLeft-track.offsetLeft;
 track.scrollTo({left:Math.max(0,left-(track.clientWidth-card.offsetWidth)/2),behavior:'instant'});
}
function switchLevel(index) {
 if(index<0||index>=levels.length||index===levelIndex)return;
 save();levelIndex=index;load();
}
let carouselDrag=null, ignoreLevelClickUntil=0;
$('#levels').onclick=e=>{if(Date.now()<ignoreLevelClickUntil)return;const button=e.target.closest('[data-level]');if(button)switchLevel(Number(button.dataset.level));};
$('#previous-level').onclick=()=>switchLevel(levelIndex-1);
$('#following-level').onclick=()=>switchLevel(levelIndex+1);
$('#levels').addEventListener('keydown',e=>{
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
  e.preventDefault();switchLevel(levelIndex+(e.key==='ArrowRight'?1:-1));
  $('#levels').querySelector(`[data-level="${levelIndex}"]`)?.focus({preventScroll:true});
 }
});
// Touch uses native horizontal scrolling; mouse drag gets the same browsing behavior.
$('#levels').addEventListener('pointerdown',e=>{
 if(e.pointerType!=='mouse'||e.button!==0)return;
 carouselDrag={id:e.pointerId,x:e.clientX,scroll:$('#levels').scrollLeft,active:false};
});
document.addEventListener('pointermove',e=>{
 if(!carouselDrag||e.pointerId!==carouselDrag.id)return;
 const dx=e.clientX-carouselDrag.x;
 if(!carouselDrag.active&&Math.abs(dx)<7)return;
 e.preventDefault();carouselDrag.active=true;$('#levels').classList.add('dragging');
 $('#levels').scrollLeft=carouselDrag.scroll-dx;
});
function finishCarouselDrag(e){
 if(!carouselDrag||e.pointerId!==carouselDrag.id)return;
 if(carouselDrag.active)ignoreLevelClickUntil=Date.now()+250;
 carouselDrag=null;$('#levels').classList.remove('dragging');
}
document.addEventListener('pointerup',finishCarouselDrag);
document.addEventListener('pointercancel',finishCarouselDrag);
window.addEventListener('resize',revealCurrentLevel);
$('#palette').onclick=e=>{if(suppressClick)return;if(won){blocked();return;}const b=e.target.closest('[data-kind]');if(b){selected={kind:b.dataset.kind,rotation:0};render();say('选好了，点一个空格放入；也可以先旋转。');}};
$('#board').onclick=e=>{
 if(suppressClick)return;if(won){blocked();return;}const b=e.target.closest('[data-cell]');if(!b)return;const i=Number(b.dataset.cell);
 if(fixed(level(),i)){blocked('起点、终点和 STOP 都是固定的哦。');return;}
 if(board[i]) { selected={...board[i],index:i};rotateSelected(); }
 else if(selected)place(selected,i);else blocked('先从百宝箱里选一张管道卡片吧。');
};
function rotateSelected(){if(!selected||won){blocked();return;}if(selected.index!==undefined){snapshot();board[selected.index]={...board[selected.index],rotation:(board[selected.index].rotation+1)%4};selected={...board[selected.index],index:selected.index};}else selected.rotation=(selected.rotation+1)%4;say('顺时针转了 90°，看看两端对齐了吗？');render();sounds.play(won?'success':'rotate');}
$('#rotate').onclick=rotateSelected;
$('#trash').onclick=()=>recycle();
$('#undo').onclick=()=>{if(!history.length)return;board=history.pop();selected=null;hintCell=-1;hintStage=0;visualHint=null;render();say('回到上一步啦。');};
$('#reset').onclick=()=>{snapshot();board=board.map(()=>null);selected=null;render();say('重新出发吧！也可以撤销这次重来。');};
$('#hint').onclick=()=>{
 if(won){say('已经全部接通啦，去挑战下一关吧！');return;}
 const h=hint(level(),board); if(!h){say('检查一下每个管口，再试一试。');return;}
 hintStage=hintCell===h.index?hintStage+1:1;hintCell=h.index;visualHint=h;render();
 const pos=String.fromCharCode(65+Math.floor(h.index/level().size))+(h.index%level().size+1);
 say(h.error?`看看发光的 ${pos}：这张卡片需要调整，试试旋转或换一种管道。`:hintStage===1?`先想想发光的 ${pos}：要接住哪两个方向的管口呢？再点提示可以多看一点。`:`${pos} 可以试试${names[h.tile.kind]}，连接${ports(h.tile).map(d=>['上方','右边','下方','左边'][d]).join('和')}。`);
};
$('#next').onclick=()=>{if(levelIndex<levels.length-1)switchLevel(levelIndex+1);else $('#reset').click();};
const guide=$('#guide');const tutorial=setupTutorial(guide,sounds);$('#help').onclick=()=>{tutorial.reset();guide.dataset.audioPrimed='1';guide.showModal();};$('#close-guide').onclick=$('#start').onclick=()=>{guide.close();try{localStorage.setItem('candy-guide-seen','1');}catch{}};
document.addEventListener('keydown',e=>{if(guide.open)return;if(e.key.toLowerCase()==='r')$('#rotate').click();if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();recycle();}if(e.key==='Escape'){selected=null;render();}});
// Pointer events support mouse, pen and touch with a single interaction model.
let drag=null, suppressClick=false;
document.addEventListener('pointerdown',e=>{
 if(e.button!==0||won||guide.open)return;
 const el=e.target.closest('[data-kind], [data-cell]');if(!el)return;
 const i=el.dataset.cell===undefined?undefined:Number(el.dataset.cell);
 if(i!==undefined&&!board[i])return;
 const source=i===undefined?{kind:el.dataset.kind,rotation:selected?.kind===el.dataset.kind&&selected.index===undefined?selected.rotation:0}:{...board[i],index:i};
 drag={source,x:e.clientX,y:e.clientY,id:e.pointerId,active:false};
});
document.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.id)return;
 if(!drag.active&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;
 e.preventDefault();if(!drag.active){drag.active=true;const ghost=document.createElement('div');ghost.id='ghost';ghost.innerHTML=art(drag.source);document.body.append(ghost);}
 const lift=e.pointerType==='touch'?90:40;
 $('#ghost').style.transform=`translate(${e.clientX-40}px,${e.clientY-lift}px)`;
 document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
 const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-cell],#trash');
 if(target&&(target.id==='trash'||!fixed(level(),Number(target.dataset.cell))&&!board[Number(target.dataset.cell)]))target.classList.add('drop-target');
},{passive:false});
function endDrag(e,cancel=false){if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;$('#ghost')?.remove();document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));if(!d.active)return;suppressClick=true;setTimeout(()=>suppressClick=false,50);if(cancel)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-cell],#trash');if(target?.id==='trash')recycle(d.source);else if(target?.dataset.cell!==undefined)place(d.source,Number(target.dataset.cell));else blocked('没有放进格子，卡片已经回到原处。');}
document.addEventListener('pointerup',e=>endDrag(e));document.addEventListener('pointercancel',e=>endDrag(e,true));
function celebrate(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<24;i++){const p=document.createElement('i');p.className='confetti';p.style.cssText=`--x:${Math.random()*100}vw;--delay:${Math.random()*.4}s;--color:${['#dfa88c','#e3c665','#55a29a','#a4b59b'][i%4]};--turn:${Math.random()*720}deg`;document.body.append(p);setTimeout(()=>p.remove(),2400);}}
load();try{if(!localStorage.getItem('candy-guide-seen'))guide.showModal();}catch{}
