import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { Rooms } from '../src/rooms.mjs';
import { normalizeBotAction } from '../src/bot-action.mjs';
import { chooseBotAction, resetOpponentModel, observeBotOpponentAction, recordCommittedRoll } from '@boardgame-hub/abyss-relay/bot/bot';
async function ask(room,difficulty){
 const worker=new Worker(new URL('../src/bot-worker.mjs',import.meta.url),{workerData:{state:room.state,history:room.history,difficulty}});
 try { const msg=await new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);worker.once('exit',code=>reject(new Error(`Worker exited: ${code}`)));});
 assert.equal(msg.ok,true,JSON.stringify(msg));const action=normalizeBotAction(msg,room.state);assert.ok(action,JSON.stringify(msg));return action;
 } finally {await worker.terminate();}
}
for(const difficulty of ['easy','normal','hard','expert']) test(`${difficulty}: second turn uses original bot decision`,async()=>{
 const r=new Rooms();const {room}=r.create('a','Alice');r.addBot('a',room.code,difficulty);r.ready('a',room.code,true);r.start('a',room.code);
 const commit=a=>r.commit(room,a);
 const roll={type:'ROLL_DICE',dice:{first:2,second:2,total:4}};
 commit({type:'START_TURN'});commit(roll);commit({type:'SKIP_TREASURE'});
 assert.equal(room.state.currentPlayerIndex,1);
 for(let i=0;i<3;i++){const action=await ask(room,difficulty);r.botAct(room,room.version,action.type==='ROLL_DICE'?roll:action);}
 assert.equal(room.state.currentPlayerIndex,0);
 commit({type:'START_TURN'});commit({type:'DECLARE_DIRECTION',turnBack:false});commit(roll);commit({type:'SKIP_TREASURE'});
 assert.equal(room.state.currentPlayerIndex,1);r.botAct(room,room.version,await ask(room,difficulty));assert.equal(room.state.turnStage,'declare');
 resetOpponentModel();for(const {state,action} of room.history){if(action.type==='ROLL_DICE')recordCommittedRoll(state,action);else observeBotOpponentAction(state,action);}
 const expected=chooseBotAction(room.state,difficulty);const actual=await ask(room,difficulty);assert.deepEqual(actual,expected);
 if(difficulty!=='expert')assert.equal(actual.turnBack,false);
 console.log(JSON.stringify({difficulty,oxygen:room.state.oxygen,position:room.state.players[1].diver.position,cargo:room.state.players[1].cargo.length,actual}));
 r.botAct(room,room.version,actual);assert.equal(room.state.players[1].diver.direction,actual.turnBack?'inward':'outward');
});
