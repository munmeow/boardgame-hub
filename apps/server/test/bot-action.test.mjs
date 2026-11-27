import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { Rooms } from '../src/rooms.mjs';
import { normalizeBotAction, fallbackBotAction } from '../src/bot-action.mjs';
const make=()=>{const r=new Rooms();const {room}=r.create('a','Alice');r.addBot('a',room.code,'normal');r.ready('a',room.code,true);r.start('a',room.code);return {r,room};};
test('normalizes wrapped and direct messages, rejects malformed actions',()=>{const {room}=make();assert.deepEqual(normalizeBotAction({action:{type:'START_TURN'}},room.state),{type:'START_TURN'});assert.equal(normalizeBotAction({type:'BAD'},room.state),null);assert.equal(normalizeBotAction({type:'ROLL_DICE'},room.state),null);assert.deepEqual(fallbackBotAction(room.state),{type:'START_TURN'});});
test('worker response is valid at initial stage for all difficulties',async()=>{const {room}=make();for(const difficulty of ['easy','normal','hard','expert']){const w=new Worker(new URL('../src/bot-worker.mjs',import.meta.url),{workerData:{state:room.state,history:[],difficulty}});try{const a=await new Promise((resolve,reject)=>{w.once('message',resolve);w.once('error',reject);});assert.deepEqual(normalizeBotAction(a,room.state),{type:'START_TURN'});}finally{await w.terminate();}}});
test('fallback advances a bot turn after invalid worker payload',()=>{const {r,room}=make();room.state.currentPlayerIndex=1;const v=room.version;assert.equal(normalizeBotAction({result:{type:'START_TURN'}},room.state),null);r.botAct(room,v,fallbackBotAction(room.state));assert.equal(room.state.turnStage,'swim');assert.equal(room.version,v+1);});
test('valid expert dice preserved and invalid dice rejected',()=>{const {room}=make();room.state.turnStage='swim';const dice={first:2,second:3,total:5};assert.deepEqual(normalizeBotAction({type:'ROLL_DICE',dice},room.state),{type:'ROLL_DICE',dice});assert.equal(normalizeBotAction({type:'ROLL_DICE',dice:{first:4,second:3,total:7}},room.state),null);});

test('Expert worker preserves real rollout decisions and emergency dice', async()=>{
  const {chooseBotAction,resetOpponentModel}=await import('@boardgame-hub/abyss-relay/bot/bot');
  const r=new Rooms();const {room}=r.create('a','Alice');r.addBot('a',room.code,'expert');r.ready('a',room.code,true);r.start('a',room.code);
  room.state.currentPlayerIndex=1;
  const state=room.state;
  const player=state.players[1];
  player.diver.position=4;
  const ask=async(s)=>{
    const w=new Worker(new URL('../src/bot-worker.mjs',import.meta.url),{workerData:{state:s,history:[],difficulty:'expert'}});
    try{const msg=await new Promise((resolve,reject)=>{w.once('message',resolve);w.once('error',reject);});assert.equal(msg.ok,true,JSON.stringify(msg));const a=normalizeBotAction(msg,s);assert.ok(a);return a;}finally{await w.terminate();}
  };
  for(const stage of ['declare','treasure']){
    const s=structuredClone(state);s.turnStage=stage;
    resetOpponentModel();const expected=chooseBotAction(s,'expert');
    assert.deepEqual(await ask(s),expected);
    room.state=s; r.botAct(room,room.version,expected);
  }
  const rescue=structuredClone(state);rescue.lastTurn=true;rescue.oxygen=0;rescue.turnStage='swim';rescue.players[1].diver.direction='inward';rescue.players[1].diver.hasTurned=true;
  const action=await ask(rescue);assert.ok(action.dice.total>=4&&action.dice.total<=6);
  room.state=rescue;r.botAct(room,room.version,action);assert.equal(room.state.players[1].diver.returned,true);
});
