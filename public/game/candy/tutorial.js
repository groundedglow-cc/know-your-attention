import { art } from './art.js';
export function setupTutorial(dialog,sounds) {
 let step=0,rotation=0,selected=false,drag=null,ignoreUntil=0,lastAnnounced=-1;
 const board=dialog.querySelector('#learn-board'),card=dialog.querySelector('#learn-card');
 function render(){
  const target=step===0||step===1?4:7;
  board.innerHTML=Array.from({length:9},(_,i)=>{
   const stop=[0,1,2,5,6].includes(i),type=stop?'stop':i===3?'start':i===8?'end':null;
   const tile=i===4&&step>0?{kind:'corner',rotation}:i===7&&step===3?{kind:'corner',rotation:0}:null;
   return `<button data-learn-cell="${i}" class="learn-cell ${i===target&&step<3?'learn-target':''}" aria-label="练习格 ${i+1}${tile?'，点击旋转':''}">${art(tile,type,i===3?1:3)}${i===target&&step<3?`<span class="learn-pointer">${step===1?'↻':'👆'}</span>`:''}</button>`;
  }).join('');
  board.classList.toggle('learn-success',step===3);
  card.innerHTML=art({kind:'corner',rotation:0});
  card.hidden=step===1||step===3;
  card.classList.toggle('selected',selected);
  dialog.querySelector('#learn-dots').innerHTML=[0,1,2].map(i=>`<span class="${step>i?'done':step===i?'current':''}">${step>i?'✓':i+1}</span>`).join('');
  dialog.querySelector('#learn-message').textContent=step===0?'把这块放到发光的格子':step===1?(rotation===0?'点一下，让管道转个弯':'再点一下，接住左边的糖果'):step===2?'再放一块，送到小朋友那里':'糖果送到啦！你学会了！';
  dialog.querySelector('#learn-cue').textContent=step===0||step===2?'🧩 ↑ 👆':step===1?'👆 ↻':'🍬 ➜ 😋';
  dialog.querySelector('#start').hidden=step!==3;
  dialog.querySelector('#learn-replay').hidden=step!==3;
  if (lastAnnounced !== step) {
   lastAnnounced = step;
   const words = ['把卡片放进发光的格子', '点一下卡片，让管道转一转', '再放一块管道，接到小朋友', '糖果送到啦，你学会了'];
   sounds.play(step===3?'guideDone':step===1?'guideRotate':'guide');
   sounds.speak(words[step]);
  }
 }
 function place(i){
  if((step===0&&i===4)||(step===2&&i===7)){step=step===0?1:3;selected=false;sounds.play(step===3?'success':'place');render();}
  else sounds.play('blocked');
 }
 board.onclick=e=>{
  if(Date.now()<ignoreUntil)return;
  const c=e.target.closest('[data-learn-cell]');if(!c)return;
  const i=Number(c.dataset.learnCell);
  if(step===1&&i===4){rotation++;if(rotation===2)step=2;sounds.play('rotate');render();}
  else if(selected)place(i);else sounds.play('blocked');
 };
 card.onclick=()=>{if(Date.now()<ignoreUntil)return;selected=true;render();};
 card.onpointerdown=e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,active:false};};
 document.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!drag.active&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
  e.preventDefault();drag.active=true;card.classList.add('learn-dragging');
  card.style.transform=`translate(${e.clientX-drag.x}px,${e.clientY-drag.y}px)`;
 },{passive:false});
 function finish(e,cancel=false){
  if(!drag||e.pointerId!==drag.id)return;
  const active=drag.active;drag=null;card.classList.remove('learn-dragging');card.style.transform='';
  if(!active)return;ignoreUntil=Date.now()+250;
  if(!cancel){const c=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-learn-cell]');if(c)place(Number(c.dataset.learnCell));else sounds.play('blocked');}
 }
 document.addEventListener('pointerup',e=>finish(e));document.addEventListener('pointercancel',e=>finish(e,true));
 function reset(){step=0;rotation=0;selected=false;lastAnnounced=-1;render();}
 dialog.querySelector('#learn-replay').onclick=reset;
 dialog.addEventListener('click',()=>{if(lastAnnounced!==step){render();}});
 dialog.addEventListener('close',()=>{drag=null;card.classList.remove('learn-dragging');card.style.transform='';});
 reset();return {reset};
}
