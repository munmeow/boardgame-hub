import { useEffect, useState } from 'react';
import type { GameState, DiceResult, Treasure, TreasureBundle, TrackTile, Player } from '@boardgame-hub/abyss-relay/types';
import type { GameAction } from '@boardgame-hub/abyss-relay/engine/actions';
import GameBoard from '../games/deep-sea-adventure/components/GameBoard';
import PlayerPanel from '../games/deep-sea-adventure/components/PlayerPanel';
import OxygenMeter from '../games/deep-sea-adventure/components/OxygenMeter';
import ActionPanel from '../games/deep-sea-adventure/components/ActionPanel';
import DiceRoller from '../games/deep-sea-adventure/components/DiceRoller';
import ScoreBoard from '../games/deep-sea-adventure/components/ScoreBoard';
import { useDiverAnimation } from '../games/deep-sea-adventure/hooks/useDiverAnimation';
import { ActionLog, TurnTimer, type ActionEntry } from './TurnDetails';
import { playGameSound } from '../gameSound';
import RoomReactions, { type Reaction } from './RoomReactions';
import '../games/deep-sea-adventure/styles/game.css';

type HiddenBundle = Omit<TreasureBundle,'treasures'> & { treasures: Omit<Treasure,'value'>[] };
type PublicState = Omit<GameState,'track'|'players'> & {track: (Omit<TrackTile,'bundle'> & {bundle:HiddenBundle|null})[];players:(Omit<Player,'cargo'> & {cargo:HiddenBundle[]})[]};
type Animation = {version:number;before:PublicState;until:number;playerId:string;position:number} & ({kind:'turn'}|{kind:'roll';direction:'outward'|'inward';path:number[];dice:DiceResult;cargoCount:number;rollDuration:number});
export type OnlineRoom = {code:string;hostId:string;version:number;state:PublicState|null;members:{id:string;name:string;playerId:string|null;isBot:boolean;connected:boolean;difficulty?:string}[];animation:Animation|null;availableAt:number;serverNow:number;botError?:string|null;previousTreasureCounts:Record<string,number>;visibility?:'public'|'private';turnDeadline?:number|null;takeoverPlayerId?:string|null;log?:ActionEntry[]};
type Props = {room:OnlineRoom;memberId:string;connected:boolean;busy:boolean;error:string;reaction:Reaction|null;onReact:(emoji:string)=>void;onAction:(a:GameAction,duration?:number)=>void;onRestart:()=>void;onRematch:()=>void};
// UI adapter only: never used for simulation, scoring of cargo, or game decisions.
function displayState(state:PublicState):GameState {
  const bundle=(b:HiddenBundle):TreasureBundle=>({...b,treasures:b.treasures.map(t=>({...t,value:0}))});
  return {...state,track:state.track.map(t=>({...t,bundle:t.bundle?bundle(t.bundle):null})),players:state.players.map(p=>({...p,cargo:p.cargo.map(bundle)}))};
}
export default function OnlineGame(props:Props){
  const [logOpen, setLogOpen] = useState(false);
  // Animation version identifies a committed action, not presence updates.
  return <OnlineBoard key={`${props.room.code}:${props.room.animation?.version??'idle'}`} {...props} logOpen={logOpen} setLogOpen={setLogOpen}/>;
}
function OnlineBoard({room,memberId,connected,busy,error,reaction,onReact,onAction,onRestart,onRematch,logOpen,setLogOpen}:Props & {logOpen:boolean;setLogOpen:(open:boolean)=>void}){
  const [initial]=useState(()=>({animation:room.animation,remaining:Math.max(0,room.availableAt-room.serverNow)}));
  const [phase,setPhase]=useState<'idle'|'rolling'|'showing'|'moving'|'turning'>(()=>initial.animation&&initial.remaining>0?(initial.animation.kind==='roll'?'rolling':'turning'):'idle');
  const [locked,setLocked]=useState(initial.remaining>0);
  const {animation,animateMovement,animateTurnBack,clearAnimation,cancelAnimation}=useDiverAnimation();
  useEffect(() => {
    if (phase === 'rolling') playGameSound('roll');
    if (phase === 'moving') playGameSound('splash');
  }, [phase]);
  useEffect(()=>{
    const a=initial.animation;
    if(!a||initial.remaining<=0)return;
    let active=true;let timer=0;let resolveWait: (()=>void)|undefined;
    const wait=(ms:number)=>new Promise<void>(resolve=>{resolveWait=resolve;timer=window.setTimeout(resolve,ms);});
    const lockTimer=window.setTimeout(()=>setLocked(false),initial.remaining+100);
    async function run(){
      try{
        if(!a)return;
        if(a.kind==='turn')await animateTurnBack({playerId:a.playerId,position:a.position});
        else {
          await wait(Math.min(a.rollDuration,initial.remaining));if(!active)return;
          setPhase('showing');await wait(400);if(!active)return;
          setPhase('moving');await animateMovement({playerId:a.playerId,startPosition:a.position,path:a.path,direction:a.direction});
        }
      }finally{if(active){clearAnimation();setPhase('idle');}}
    }
    void run();
    return()=>{active=false;window.clearTimeout(timer);window.clearTimeout(lockTimer);resolveWait?.();cancelAnimation();};
  },[initial,animateMovement,animateTurnBack,clearAnimation,cancelAnimation]);
  if(!room.state)return null;
  const a=initial.animation;
  const animating=phase!=='idle'&&!!a;
  const state=displayState(animating&&a?a.before:room.state);
  const current=state.players[state.currentPlayerIndex];
  const me=room.members.find(m=>m.id===memberId);
  const member=room.members.find(m=>m.playerId===current?.id);
  const host=room.hostId===memberId;
  const blocked=busy||!connected||locked||animating;
  const yourTurn=me?.playerId===current?.id;
  const takenOver=room.takeoverPlayerId===current?.id;
  const dice=a?.kind==='roll'&&animating?a.dice:state.diceResult;
  return <main className={`dsa-game dsa-game--vertical ${state.phase!=='playing'?'dsa-summary-active':''}`}>
    <header className="dsa-header"><div><h1>Abyss Relay</h1><p>Room {room.code} · Dive {state.round}/3 · {connected?'Online':'Reconnecting…'}</p></div>{host&&<button disabled={blocked} onClick={onRestart}>Back to lobby</button>}</header>
    <div className="dsa-game-layout"><div className="dsa-main-board"><div className="dsa-table-layout"><PlayerPanel state={state} side="left"/><div className="dsa-table-center"><GameBoard state={state} animation={animation}/></div><PlayerPanel state={state} side="right"/></div></div>
    <aside className="dsa-sidebar"><OxygenMeter oxygen={state.oxygen}/>{state.lastTurn&&state.phase==='playing'&&<div className="dsa-warning">Oxygen depleted. Final turn.</div>}
      {state.phase==='playing'&&<div className="dsa-control-card"><div className="dsa-current-turn"><span className="dsa-turn-indicator"/><div><span className="dsa-turn-label">{yourTurn?'YOUR TURN':'CURRENT TURN'}</span><h2>{current?.name}</h2>{member?.isBot&&<span className="dsa-bot-level">{member.difficulty?.toUpperCase()} BOT</span>}{!animating&&connected&&room.turnDeadline!=null&&<TurnTimer key={room.turnDeadline} milliseconds={room.turnDeadline-room.serverNow}/>}</div></div>
      {(state.turnStage!=='breathe'||animating)&&<DiceRoller rolling={phase==='rolling'} moving={phase==='moving'} turning={phase==='turning'} rollDuration={a?.kind==='roll'?a.rollDuration:900} result={phase==='rolling'?null:dice} cargoCount={a?.kind==='roll'&&animating?a.cargoCount:current?.cargo.length??0}/>}
      {blocked?<p role="status">{!connected?'Reconnecting…':animating?'Playing animation…':'Waiting for server…'}</p>:takenOver?<p role="status">Bot is finishing this turn.</p>:yourTurn?<ActionPanel state={state} isBot={false} isRolling={false} onAction={onAction}/>:<p role="status">{member?.isBot?'Bot is thinking…':member?.connected?'Waiting for player…':'Player disconnected. Waiting until the turn timer expires…'}</p>}</div>}
      <ActionLog entries={room.log ?? []} open={logOpen} onOpenChange={setLogOpen}/>
      <RoomReactions reaction={reaction} disabled={!connected} onReact={onReact}/>
      {(error||room.botError)&&<p role="alert" className="dsa-error">{error||room.botError}</p>}
    </aside></div>
    {!animating&&state.phase!=='playing'&&state.phase!=='setup'&&<ScoreBoard key={state.round} state={state} previousTreasureCounts={room.previousTreasureCounts} hostControlsDisabled={!host||blocked} onNextRound={()=>onAction({type:'NEXT_ROUND'})} onRestart={onRematch} restartLabel="Rematch"/>}
  </main>;
}
