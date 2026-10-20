import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../game/candy/levels.js';
import { solve, complete, hint, ports, fixed } from '../game/candy/engine.js';
for(const l of levels) test(`Booklet level ${l.id} is solvable, fills every space and preserves fixed cards`,()=>{
 const solution=solve(l);assert.ok(solution);assert.ok(complete(l,solution));
 assert.equal(solution.filter(Boolean).length,l.size**2-l.stops.length-2);
 solution.forEach((tile,i)=>{if(fixed(l,i))assert.equal(tile,null);});
 const i=solution.findIndex(Boolean), missing=[...solution];missing[i]=null;
 assert.equal(complete(l,missing),false);assert.equal(hint(l,missing).index,i);assert.equal(hint(l,missing).error,false);
 const broken=solution.map(t=>t&&({...t}));broken[i].rotation=(broken[i].rotation+1)%4;
 assert.equal(complete(l,broken),false);assert.equal(solve(l,broken),null);assert.equal(hint(l,broken).error,true);
});
test('Booklet endpoints and STOP positions are transcribed exactly',()=>{
 assert.deepEqual(levels.map(l=>[l.stops,l.start.index,l.start.direction,l.end.index,l.end.direction]),[
 [[0,1,2,5,6],3,1,8,3],[[0,1,3,8],2,2,6,1],[[0,3,5,8],6,1,2,3],[[3,6],2,2,0,1]]);
});
test('Rotation, blocked edges, and empty boards',()=>{
 assert.deepEqual(ports({kind:'corner',rotation:3}),[0,3]);
 for(const l of levels){assert.equal(complete(l,Array(l.size**2).fill(null)),false);const b=Array(l.size**2).fill(null);const i=b.findIndex((_,i)=>!fixed(l,i));b[i]={kind:'cross',rotation:0};assert.equal(solve(l,b),null);}
});

test('Start at first unfinished level, even if later levels were completed; all done falls back to first',async()=>{
 const { firstUnfinished }=await import('../game/candy/progress.js');
 assert.equal(firstUnfinished(levels,new Set()),0);
 assert.equal(firstUnfinished(levels,new Set([1,3])),1);
 assert.equal(firstUnfinished(levels,new Set([1,2,3])),3);
 assert.equal(firstUnfinished(levels,new Set([1,2,3,4])),0);
});
test('Reset or undo removes completion; restoring a solved board earns it again',async()=>{
 const { syncCompletion,firstUnfinished }=await import('../game/candy/progress.js');
 const completed=new Set([1,2]);
 syncCompletion(completed,1,false);
 assert.deepEqual([...completed],[2]);assert.equal(firstUnfinished(levels,completed),0);
 syncCompletion(completed,1,true);assert.ok(completed.has(1));
 syncCompletion(completed,1,false);assert.ok(!completed.has(1));
});

test('4×4 mobile fixture has a valid full-board route',()=>{
 const fixture={id:1,name:'4×4 QA',size:4,stops:[],start:{index:0,direction:1},end:{index:12,direction:1}};
 const solution=solve(fixture);
 assert.ok(solution);assert.equal(solution.length,16);assert.ok(complete(fixture,solution));
});
