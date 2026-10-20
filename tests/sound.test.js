import test from 'node:test';
import assert from 'node:assert/strict';
import { createSounds } from '../game/candy/sound.js';
function audioHarness(){
 const events=[];
 const parameter={setValueAtTime(){},exponentialRampToValueAtTime(){}};
 const context={state:'running',currentTime:1,destination:{},
  createOscillator(){return {frequency:parameter,connect(){},disconnect(){},start(time){events.push(time);},stop(){}};},
  createGain(){return {gain:parameter,connect(){},disconnect(){}};},
  close(){this.state='closed';return Promise.resolve();},
 };
 return {events,context};
}
test('Audio is lazy, muted settings persist, and muted actions create no audio',async()=>{
 let creations=0;const store=new Map([['candy-sound','off']]);const {context,events}=audioHarness();
 const sound=createSounds({createContext(){creations++;return context;},storage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}});
 assert.equal(creations,0);await sound.play('rotate');assert.equal(creations,0);
 sound.toggle();assert.equal(store.get('candy-sound'),'on');assert.equal(creations,1);
 sound.toggle();const count=events.length;await sound.play('blocked');assert.equal(events.length,count);assert.equal(context.state,'closed');
});
test('Distinct rotate, recycle and blocked cues schedule softly and throttle rapid repeats',async()=>{
 const {events,context}=audioHarness();const sound=createSounds({createContext:()=>context});
 await sound.play('rotate');assert.equal(events.length,1);
 await sound.play('rotate');assert.equal(events.length,1);
 context.currentTime+=1;await sound.play('recycle');assert.equal(events.length,3);
 context.currentTime+=1;await sound.play('blocked');assert.equal(events.length,5);
});
test('Unavailable audio and inaccessible storage never block gameplay',async()=>{
 const sound=createSounds({createContext(){throw Error('No audio');},storage:{getItem(){throw Error('Blocked');},setItem(){throw Error('Blocked');}}});
 await assert.doesNotReject(sound.play('blocked'));assert.doesNotThrow(()=>sound.toggle());
});
