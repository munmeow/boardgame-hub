import { randomBytes, randomInt } from 'node:crypto';
import { getMovementPath, calculateMovement } from '@boardgame-hub/abyss-relay/engine/movement';
import { setupGame, applyAction } from '@boardgame-hub/abyss-relay';

const fail = (message) => { throw new Error(message); };
const codeOf = (value) => typeof value === 'string' ? value.trim().toUpperCase() : '';
const nameOf = (value) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 24) fail('Nickname must be 1–24 characters');
  return value.trim();
};
const hideBundle = (bundle) => bundle && ({ id: bundle.id, treasures: bundle.treasures.map(({id, level}) => ({id, level})) });
export function publicState(state) {
  if (!state) return null;
  return structuredClone({ ...state, track: state.track.map(t => ({...t, bundle: hideBundle(t.bundle)})), players: state.players.map(p => ({...p, cargo: p.cargo.map(hideBundle)})) });
}
function cleanAction(input) {
  if (!input || typeof input !== 'object') fail('Invalid action');
  switch(input.type) {
    case 'START_TURN': case 'PICK_UP_TREASURE': case 'SKIP_TREASURE': case 'NEXT_ROUND': return {type: input.type};
    case 'ROLL_DICE': {
      if ('dice' in input) fail('Client cannot supply dice');
      const first = randomInt(1,4), second = randomInt(1,4);
      return {type: 'ROLL_DICE', dice: {first, second, total: first+second}};
    }
    case 'DECLARE_DIRECTION': if(typeof input.turnBack !== 'boolean') fail('Invalid direction'); return {type: input.type, turnBack: input.turnBack};
    case 'DROP_TREASURE': if(typeof input.bundleId !== 'string' || input.bundleId.length > 100) fail('Invalid bundle'); return {type: input.type, bundleId: input.bundleId};
    default: fail('Unknown action');
  }
}
export class Rooms {
  rooms = new Map();
  constructor({maxRooms=200, expiryMs=30*60_000, animationLocks=false}={}) {this.maxRooms=maxRooms; this.expiryMs=expiryMs; this.animationLocks=animationLocks;}
  get(code) { const room=this.rooms.get(codeOf(code)); if(!room) fail('Room not found'); return room; }
  member(room, socketId) { const member=room.members.find(m=>m.socketId===socketId); if(!member) fail('Not a room member'); return member; }
  host(room, socketId) {const member=this.member(room,socketId); if(member.id!==room.hostId) fail('Host only'); return member;}
  touch(room) {room.updatedAt=Date.now(); room.version++;}
  view(room) {return {code:room.code, hostId:room.hostId, version:room.version, members:room.members.map(({id,name,ready,socketId,playerId,isBot,difficulty})=>({id,name,ready,connected:!!socketId||!!isBot,playerId,isBot:!!isBot,difficulty})), state:publicState(room.state), previousTreasureCounts:room.previousTreasureCounts||{}, animation:room.animation||null, availableAt:room.availableAt||0, serverNow:Date.now(), botError:room.botFailure?.version===room.version&&room.botFailure.attempts>=2?"Bot calculation failed twice. Return to lobby to restart the match.":null};}
  add(room, socketId, name) { const member={id:randomBytes(12).toString('hex'),token:randomBytes(32).toString('hex'),name:nameOf(name),socketId,ready:false,playerId:null}; room.members.push(member); this.touch(room); return member; }
  ensureFree(socketId) {for(const room of this.rooms.values()) if(room.members.some(m=>m.socketId===socketId)) fail('Already in a room');}
  create(socketId,name) {this.ensureFree(socketId); nameOf(name); if(this.rooms.size>=this.maxRooms) fail('Room limit reached'); let code; do {code=randomBytes(4).toString('hex').slice(0,6).toUpperCase();} while(this.rooms.has(code)); const room={code,hostId:null,members:[],state:null,version:0,updatedAt:Date.now()}; const member=this.add(room,socketId,name); room.hostId=member.id; this.rooms.set(code,room); return {room,member};}
  join(socketId,code,name) {this.ensureFree(socketId); const room=this.get(code); if(room.state) fail('Game already started'); if(room.members.length>=6) fail('Room full'); return {room,member:this.add(room,socketId,name)};}
  resume(socketId,code,token) {this.ensureFree(socketId); const room=this.get(code); const member=room.members.find(m=>typeof token==='string' && m.token===token); if(!member || member.isBot || member.socketId) fail('Invalid or active session'); member.socketId=socketId; this.touch(room); return {room,member};}
  ready(socketId,code,ready) {const room=this.get(code), member=this.member(room,socketId); if(room.state||typeof ready!=='boolean') fail('Invalid ready request'); member.ready=ready; this.touch(room); return room;}
  addBot(socketId,code,difficulty) {const room=this.get(code);this.host(room,socketId);if(room.state||room.members.length>=6) fail('Cannot add bot');if(!['easy','normal','hard','expert'].includes(difficulty)) fail('Invalid difficulty');const member={id:randomBytes(12).toString('hex'),name:`${difficulty[0].toUpperCase()+difficulty.slice(1)} Bot`,isBot:true,difficulty,ready:true,socketId:null,playerId:null};room.members.push(member);this.touch(room);return room;}
  removeBot(socketId,code,id) {const room=this.get(code);this.host(room,socketId);if(room.state||!room.members.some(m=>m.id===id&&m.isBot)) fail('Cannot remove bot');room.members=room.members.filter(m=>m.id!==id);this.touch(room);return room;}
  kick(socketId,code,id) {
    const room=this.get(code), host=this.host(room,socketId);
    if(room.state) fail('Game already started');
    const target=room.members.find(m=>m.id===id);
    if(!target || target.isBot || target.id===host.id) fail('Cannot kick this player');
    room.members=room.members.filter(m=>m.id!==id);
    this.touch(room);
    return {room,target};
  }
  leave(socketId,code) {const room=this.get(code),member=this.member(room,socketId);if(room.state) fail('Game already started');room.members=room.members.filter(m=>m.id!==member.id);if(!room.members.some(m=>!m.isBot)){this.rooms.delete(room.code);return null;}if(room.hostId===member.id) room.hostId=(room.members.find(m=>m.socketId)||room.members.find(m=>!m.isBot)).id;this.touch(room);return room;}
  resetLobby(socketId,code) {const room=this.get(code);this.host(room,socketId);if(!room.state) fail('Game not started');room.state=null;room.animation=null;room.availableAt=0;room.previousTreasureCounts={};room.history=[];for(const m of room.members){m.playerId=null;m.ready=!!m.isBot;}this.touch(room);return room;}
  start(socketId,code) {const room=this.get(code); this.host(room,socketId); if(room.state||room.members.length<2||room.members.some(m=>!m.ready||(!m.socketId&&!m.isBot))) fail('Need 2–6 connected, ready players'); room.animation=null;room.availableAt=0;room.previousTreasureCounts={};room.history=[];room.state=setupGame(room.members.map(m=>m.name),()=>randomInt(0,2**32)/2**32); room.members.forEach((m,i)=>m.playerId=room.state.players[i].id); this.touch(room); return room;}
  act(socketId,code,version,input,duration) {const room=this.get(code), member=this.member(room,socketId); if(!room.state || version!==room.version) fail('Stale or missing game state'); const state=room.state; if(input?.type==='NEXT_ROUND') {this.host(room,socketId); if(state.phase!=='round-ended') fail('Dive not ended');} else {if(state.phase!=='playing'||state.players[state.currentPlayerIndex].id!==member.playerId) fail('Not your turn');} const action=cleanAction(input); return this.commit(room,action,duration);}
  commit(room,action,duration=900) {
    if(this.animationLocks && Date.now()<(room.availableAt||0)) fail('Animation in progress');
    const before=room.state, next=applyAction(before,action);
    const player=before.players[before.currentPlayerIndex];
    let animation=null, delay=0;
    if(action.type==='ROLL_DICE') {
      const rollDuration=Number.isFinite(duration)?Math.round(Math.max(600,Math.min(2400,duration))):900;
      const path=getMovementPath(before,player,calculateMovement(action.dice.total,player.cargo.length));
      delay=rollDuration+400+path.length*510+350;
      animation={kind:'roll',playerId:player.id,position:player.diver.position,direction:player.diver.direction,path,dice:action.dice,cargoCount:player.cargo.length,rollDuration};
    } else if(action.type==='DECLARE_DIRECTION'&&action.turnBack){delay=800;animation={kind:'turn',playerId:player.id,position:player.diver.position};}
    if(action.type==='NEXT_ROUND') room.previousTreasureCounts=Object.fromEntries(before.players.map(p=>[p.id,p.collected.length]));
    room.history??=[];
    if(['ROLL_DICE','DECLARE_DIRECTION','PICK_UP_TREASURE','DROP_TREASURE','SKIP_TREASURE'].includes(action.type)) room.history.push({state:before,action});
    room.state=next;this.touch(room);
    room.availableAt=this.animationLocks?Date.now()+delay:0;
    room.animation=animation?{...animation,version:room.version,before:publicState(before),until:room.availableAt}:null;
    return {room,action};
  }
  botAct(room,version,action) {
    if(room.version!==version||room.state?.phase!=='playing'||!room.members.some(m=>m.isBot&&m.playerId===room.state.players[room.state.currentPlayerIndex].id)) fail('Stale bot action');
    if(action?.type==='ROLL_DICE'&&!action.dice) action=cleanAction(action);
    return this.commit(room,action);
  }
  disconnect(socketId) {const changed=[]; for(const room of this.rooms.values()){const member=room.members.find(m=>m.socketId===socketId); if(!member) continue; member.socketId=null; if(!room.state) member.ready=false; if(room.hostId===member.id){const next=room.members.find(m=>m.socketId); if(next) room.hostId=next.id;} this.touch(room); changed.push(room);} return changed;}
  sweep(now=Date.now()) {for(const [code,room] of this.rooms) if(room.members.every(m=>!m.socketId)&&now-room.updatedAt>this.expiryMs) this.rooms.delete(code);}
}
