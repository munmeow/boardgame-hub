import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Worker } from 'node:worker_threads';
import { Rooms } from './rooms.mjs';
import { normalizeBotAction } from './bot-action.mjs';
const origins=(process.env.WEB_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(s=>s.trim()).filter(Boolean);
const app=express();
app.get('/health',(_req,res)=>res.json({ok:true,service:'boardgame-hub-server'}));
const http=createServer(app);
const io=new Server(http,{cors:{origin:origins},allowRequest:(req,cb)=>cb(null,!req.headers.origin||origins.includes(req.headers.origin)),maxHttpBufferSize:16*1024});
const rooms=new Rooms({animationLocks:true});
const jobs=new Map();
let workers=0;
function schedule(room){
  if(jobs.has(room.code)||room.state?.phase!=='playing'||!room.members.some(m=>m.socketId))return;
  if(room.botFailure?.version===room.version && room.botFailure.attempts>=2)return;
  const bot=room.members.find(m=>m.isBot&&m.playerId===room.state.players[room.state.currentPlayerIndex].id);
  if(!bot)return;
  const timer=setTimeout(()=>{
    jobs.delete(room.code);
    if(rooms.rooms.get(room.code)!==room||room.state?.phase!=='playing'||!room.members.some(m=>m.socketId))return;
    if(workers>=2){schedule(room);return;}
    const current=room.members.find(m=>m.isBot&&m.playerId===room.state.players[room.state.currentPlayerIndex].id);
    if(!current)return;
    const version=room.version;
    const started=Date.now();
    const timeoutMs=current.difficulty==='expert'?60000:15000;
    const failed=(error)=>{
      if(room.version!==version)return;
      const attempts=(room.botFailure?.version===version?room.botFailure.attempts:0)+1;
      room.botFailure={version,attempts};
      console.error('Bot decision failed', {room:room.code,difficulty:current.difficulty,stage:room.state.turnStage,attempts,elapsedMs:Date.now()-started,error:String(error)});
    };
    let worker;
    try {
      worker=new Worker(new URL('./bot-worker.mjs',import.meta.url),{workerData:{state:room.state,history:room.history||[],difficulty:current.difficulty}});
    } catch(error){failed(error);publish(room);return;}
    workers++;jobs.set(room.code,worker);
    let done=false;
    const finish=(message,error)=>{
      if(done)return;
      done=true;clearTimeout(timeout);workers--;jobs.delete(room.code);void worker.terminate();
      if(rooms.rooms.get(room.code)!==room)return;
      if(room.version===version&&room.state?.phase==='playing'){
        try {
          if(error)throw error;
          if(message?.ok===false)throw new Error(message.error||'Worker failed');
          const normalized=normalizeBotAction(message,room.state);
          if(!normalized)throw new Error('Invalid bot action: '+JSON.stringify(message));
          const player=room.state.players[room.state.currentPlayerIndex];
          if(process.env.BOT_TRACE==='1' || normalized.type==='DECLARE_DIRECTION') {
            console.info('[Bot decision]', JSON.stringify({room:room.code,version,difficulty:current.difficulty,round:room.state.round,stage:room.state.turnStage,oxygen:room.state.oxygen,lastTurn:room.state.lastTurn,position:player.diver.position,cargo:player.cargo.length,action:normalized,elapsedMs:Date.now()-started}));
          }
          rooms.botAct(room,version,normalized);
          room.botFailure=null;
        } catch(error){failed(error);}
      }
      publish(room);
    };
    const timeout=setTimeout(()=>finish(null,new Error(`Worker timeout after ${timeoutMs}ms`)),timeoutMs);
    // Node --watch can emit internal watch:import messages before the result.
    worker.on('message',message=>{
      if(message?.kind !== 'bot:result') return;
      finish(message);
    });
    worker.once('error',error=>finish(null,error));
    worker.once('exit',code=>finish(null,new Error(`Worker exited before returning an action (${code})`)));
  },Math.max(700,(room.availableAt||0)-Date.now()+100));
  jobs.set(room.code,timer);
}
const publish=room=>{io.to(room.code).emit('room:state',rooms.view(room));schedule(room);};
io.on('connection',socket=>{
  let count=0, windowStart=Date.now();
  const handle=(event,fn)=>socket.on(event,(data,ack)=>{
    if(typeof ack!=='function') return;
    if(Date.now()-windowStart>10_000){count=0;windowStart=Date.now();}
    if(++count>60){ack({ok:false,error:'Too many requests'});return;}
    try{if(!data||typeof data!=='object') throw new Error('Invalid request'); const result=fn(data); ack({ok:true,...result});}catch(error){ack({ok:false,error:error instanceof Error?error.message:'Request failed'});}
  });
  const enter=({room,member})=>{socket.join(room.code);publish(room);return {memberId:member.id,token:member.token,room:rooms.view(room)};};
  handle('room:create',d=>enter(rooms.create(socket.id,d.name)));
  handle('room:join',d=>enter(rooms.join(socket.id,d.code,d.name)));
  handle('room:resume',d=>{
    const resumed=rooms.resume(socket.id,d.code,d.token);
    if(resumed.previousSocketId && resumed.previousSocketId!==socket.id){
      const previous=io.sockets.sockets.get(resumed.previousSocketId);
      if(previous){previous.leave(resumed.room.code);previous.emit('room:replaced',{code:resumed.room.code});previous.disconnect(true);}
    }
    return enter(resumed);
  });
  handle('room:ready',d=>{const room=rooms.ready(socket.id,d.code,d.ready);publish(room);return {room:rooms.view(room)};});
  handle('room:bot:add',d=>{const room=rooms.addBot(socket.id,d.code,d.difficulty);publish(room);return {room:rooms.view(room)};});
  handle('room:bot:remove',d=>{const room=rooms.removeBot(socket.id,d.code,d.id);publish(room);return {room:rooms.view(room)};});
  handle('room:sync',d=>{const room=rooms.get(d.code);rooms.member(room,socket.id);return {room:rooms.view(room)};});
  handle('room:kick',d=>{
    const {room,target}=rooms.kick(socket.id,d.code,d.id);
    const kicked=target.socketId?io.sockets.sockets.get(target.socketId):null;
    if(kicked){
      kicked.emit('room:kicked',{code:room.code,message:'You were removed from the room by the host.'});
      kicked.leave(room.code);
    }
    console.info('[Room kick]',{room:room.code,memberId:target.id});
    publish(room);
    return {room:rooms.view(room)};
  });
  handle('room:leave',d=>{const room=rooms.leave(socket.id,d.code);socket.leave(String(d.code).trim().toUpperCase());if(room)publish(room);return {};});
  handle('room:reset',d=>{const room=rooms.resetLobby(socket.id,d.code);publish(room);return {room:rooms.view(room)};});
  handle('room:start',d=>{const room=rooms.start(socket.id,d.code);publish(room);return {room:rooms.view(room)};});
  handle('game:action',d=>{const {room,action}=rooms.act(socket.id,d.code,d.version,d.action,d.duration); const view=rooms.view(room);io.to(room.code).emit('game:committed',{version:room.version,action,room:view});publish(room);return {room:view};});
  socket.on('disconnect',()=>rooms.disconnect(socket.id).forEach(publish));
});
setInterval(()=>rooms.sweep(),60_000).unref();
const port=Number(process.env.PORT||3001);
http.listen(port,'0.0.0.0',()=>console.log(`Boardgame Hub server listening on ${port} [Phase 5.7: kick and session sync, tagged worker results]`));
