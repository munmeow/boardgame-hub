import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import './rooms.css';
import OnlineGame, { type OnlineRoom } from './OnlineGame';
import type { GameAction } from '@boardgame-hub/abyss-relay/engine/actions';

type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';
type Member = { id: string; name: string; ready: boolean; connected: boolean; isBot: boolean; difficulty?: Difficulty; playerId: string | null };
type Room = Omit<OnlineRoom, 'members'> & { members: Member[] };
type Session = { code: string; token: string; memberId: string };
type Reply = { ok: boolean; error?: string; room?: Room; token?: string; memberId?: string };
const BOT_LABELS: Record<Difficulty, string> = {easy:'Easy Bot',normal:'Normal Bot',hard:'Hard Bot',expert:'Expert Bot'};
const STORAGE = 'bgh-room-session';
const SERVER = import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:3001';
function readSession(): Session | null { try { return JSON.parse(sessionStorage.getItem(STORAGE) || 'null'); } catch { return null; } }
function saveSession(value: Session | null) { try { if (value) sessionStorage.setItem(STORAGE, JSON.stringify(value)); else sessionStorage.removeItem(STORAGE); } catch { /* storage unavailable */ } }
function request(socket: Socket, event: string, data: object): Promise<Reply> { return new Promise(resolve => { socket.timeout(8000).emit(event, data, (err: Error | null, reply: Reply) => resolve(err ? {ok:false,error:'Request timed out. Reconnect before retrying.'} : reply)); }); }

export default function PrivateRooms() {
  const socketRef = useRef<Socket | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const busyRef = useRef(false);
  const [room,setRoom] = useState<Room | null>(null);
  const [memberId,setMemberId] = useState('');
  const [connected,setConnected] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [name,setName] = useState('');
  const [code,setCode] = useState(() => window.location.hash.split('/')[2] || '');
  const [difficulty,setDifficulty] = useState<Difficulty>('normal');
  const [notice,setNotice] = useState('');
  function clearRoom(message: string) {
    sessionRef.current=null;saveSession(null);setRoom(null);setMemberId('');setNotice('');setError(message);
  }
  useEffect(() => {
    let alive = true;
    sessionRef.current = readSession();
    const socket = io(SERVER,{autoConnect:false}); socketRef.current = socket;
    const update = (next: Room) => {
      const session=sessionRef.current;
      if(!alive || !session || session.code!==next.code) return;
      if(!next.members.some(m=>m.id===session.memberId)){clearRoom('You are no longer a member of this room.');return;}
      setRoom(old => old && old.code===next.code && old.version>next.version ? old : next);
    };
    let syncing=false;
    const syncTimer=window.setInterval(async()=>{
      const session=sessionRef.current;
      if(!alive || !socket.connected || !session || syncing || busyRef.current) return;
      syncing=true;
      try {
        const result=await request(socket,'room:sync',{code:session.code});
        if(!alive || sessionRef.current!==session || !socket.connected) return;
        if(result.ok && result.room) update(result.room);
        else if(result.error==='Not a room member' || result.error==='Room not found') clearRoom('You are no longer a member of this room.');
      } finally {syncing=false;}
    },5000);
    socket.on('room:state',update);
    socket.on('room:kicked',(event: {code:string;message:string})=>{
      if(!alive || sessionRef.current?.code!==event.code) return;
      clearRoom(event.message);
    });
    socket.on('connect',async () => {
      if(!alive) return;
      const session = sessionRef.current;
      if(session) {
        const result = await request(socket,'room:resume',{code:session.code,token:session.token});
        if(!alive || !socket.connected || sessionRef.current!==session) return;
        if(result.ok && result.room) {setMemberId(session.memberId);update(result.room);setError('');}
        else {setError(result.error || 'Could not resume room');sessionRef.current=null;saveSession(null);setRoom(null);setMemberId('');}
      }
      setConnected(true);
    });
    socket.on('disconnect',()=>{if(alive)setConnected(false);});
    socket.on('connect_error',()=>{if(alive){setConnected(false);setError('Cannot connect to game server. Check server URL and status.');}});
    socket.connect();
    return ()=>{alive=false;window.clearInterval(syncTimer);socket.disconnect();socketRef.current=null;};
  },[]);
  async function send(event: string, data: object) {
    const socket=socketRef.current;
    if(!socket?.connected || busyRef.current || !connected) return;
    const sessionAtRequest=sessionRef.current;
    busyRef.current=true;setBusy(true);setError('');
    try {
      const result=await request(socket,event,data);
      if(socketRef.current!==socket || sessionRef.current!==sessionAtRequest) return;
      if(!result.ok){
        if(sessionAtRequest && (result.error==='Not a room member' || result.error==='Room not found')) clearRoom('You are no longer a member of this room.');
        else setError(result.error||'Request failed');
        return;
      }
      if(event==='room:leave'){sessionRef.current=null;saveSession(null);setRoom(null);setMemberId('');return;}
      if(result.room && result.token && result.memberId){const session={code:result.room.code,token:result.token,memberId:result.memberId};sessionRef.current=session;saveSession(session);setMemberId(session.memberId);}
      if(result.room){const next=result.room;if(sessionRef.current && !next.members.some(m=>m.id===sessionRef.current?.memberId)){clearRoom('You are no longer a member of this room.');return;}setRoom(old=>old && old.code===next.code && old.version>next.version?old:next);}
    } finally {busyRef.current=false;if(socketRef.current===socket)setBusy(false);}
  }
  const me=room?.members.find(m=>m.id===memberId);
  const host=room?.hostId===memberId;
  const canStart=!!room && room.members.length>=2 && room.members.every(m=>m.connected&&m.ready);
  const disabled=busy||!connected;
  async function copyInvite(){if(!room)return;const link=new URL(window.location.href);link.hash=`/rooms/${room.code}`;try{await navigator.clipboard.writeText(link.href);setNotice('Invite copied');}catch{setNotice('Share room code: '+room.code);}}
  function gameAction(action: GameAction, duration?: number) {
    if(!room) return;
    const safeAction=action.type==='ROLL_DICE'?{type:'ROLL_DICE'}:action;
    void send('game:action',{code:room.code,version:room.version,action:safeAction,duration});
  }
  if(room?.state) return <OnlineGame room={room} memberId={memberId} connected={connected} busy={busy} error={error} onAction={gameAction} onRestart={()=>{if(host && window.confirm('Return everyone to the lobby?'))void send('room:reset',{code:room.code});}} />;
  return <main className="bgh-rooms"><header className="bgh-room-heading"><p className="bgh-eyebrow">ABYSS RELAY · ONLINE PREVIEW</p><h1>Private rooms</h1><span className="bgh-status">{connected?'Connected':'Connecting / offline'}</span></header>
    {error && <p role="alert" className="bgh-room-error">{error}</p>}
    {!room ? <section className="bgh-room-card"><label>Nickname<input maxLength={24} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" /></label><button disabled={disabled||!name.trim()} onClick={()=>void send('room:create',{name})}>Create room</button><hr/><form onSubmit={e=>{e.preventDefault();void send('room:join',{code,name});}}><label>Room code<input maxLength={6} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="ABC123" /></label><button disabled={disabled||!name.trim()||code.trim().length!==6}>Join room</button></form></section> : <section className="bgh-room-card"><div className="bgh-room-top"><div><small>ROOM CODE</small><h2>{room.code}</h2></div><button onClick={()=>void copyInvite()}>Copy invite</button></div><p role="status">{notice}</p><h3>Crew · {room.members.length}/6</h3><div className="bgh-room-members">{room.members.map(m=><div className="bgh-room-member" key={m.id}><div><strong>{m.name}{m.id===memberId?' (you)':''}</strong><small>{m.isBot?(m.difficulty ? BOT_LABELS[m.difficulty] : 'Bot'):m.id===room.hostId?'Host':'Player'}</small></div><span className={`bgh-member-status bgh-member-status--${!m.connected?'offline':m.ready?'ready':'waiting'}`}><span aria-hidden="true">{!m.connected?'○':m.ready?'✓':'◷'}</span> {!m.connected?'Offline':m.ready?'Ready':'Not ready'}</span>{host&&m.isBot&&!room.state&&<button disabled={disabled} onClick={()=>void send('room:bot:remove',{code:room.code,id:m.id})}>Remove</button>}{host&&!m.isBot&&m.id!==memberId&&!room.state&&<button className="bgh-kick-button" disabled={disabled} onClick={()=>{if(window.confirm(`Kick ${m.name} from the room?`))void send('room:kick',{code:room.code,id:m.id});}}>Kick</button>}</div>)}</div>
    {<> <div className="bgh-room-actions"><button disabled={disabled||!me} onClick={()=>void send('room:ready',{code:room.code,ready:!me?.ready})}>{me?.ready?'Not ready':'Ready'}</button><button disabled={disabled} onClick={()=>void send('room:leave',{code:room.code})}>Leave room</button></div>{host&&<><div className="bgh-room-actions"><select aria-label="Bot difficulty" value={difficulty} onChange={e=>setDifficulty(e.target.value as Difficulty)}><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option><option value="expert">Expert (assisted dice)</option></select><button disabled={disabled||room.members.length>=6} onClick={()=>void send('room:bot:add',{code:room.code,difficulty})}>Add bot</button></div><button disabled={disabled||!canStart} onClick={()=>void send('room:start',{code:room.code})}>Start adventure</button></>}</>}
    </section>}
  </main>;
}
