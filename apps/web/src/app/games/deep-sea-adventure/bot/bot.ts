import type { GameState, Player, TreasureBundle, DiceResult } from "../types";
import { applyAction, type GameAction } from "../engine/actions";
import { getCurrentPlayer } from "../engine/state";
import { canPickUpTreasure, canDropTreasure } from "../engine/treasure";
import { calculateMovement, getMovementPath } from "../engine/movement";
import { expectedValue } from "./simulation";

export type BotDifficulty = "easy" | "normal" | "hard" | "expert";
const settings = {
  easy: { target: 2, margin: 2 },
  normal: { target: 2, margin: 0 },
  hard: { target: 2, margin: 2 },
  expert: { target: 2, margin: 4 },
};

function returnCost(state: GameState, player: Player, cargo: TreasureBundle[], advanced: boolean): number {
  const others = state.players.filter(p => p.id !== player.id && !p.diver.returned);
  const occupied = advanced ? new Set(others.filter(p => p.diver.position > 0 && p.diver.position < player.diver.position).map(p => p.diver.position)).size : 0;
  const distance = Math.max(1, player.diver.position - occupied);
  const speed = Math.max(0.33, (Array.from({length: 9}, (_, i) => Math.max(0, 2 + Math.floor(i / 3) + i % 3 - cargo.length)).reduce((a,b) => a+b,0)) / 9);
  return Math.ceil(distance / speed) * (cargo.length + others.reduce((sum,p) => sum + p.cargo.length,0));
}

function trailing(state: GameState, player: Player): boolean {
  const score = (p: Player) => p.collected.reduce((sum,t) => sum+t.value,0);
  return state.round === 3 && state.players.some(p => score(p) > score(player) + 6);
}

// Dynamic oxygen reserve by difficulty.
function dynamicMargin(state: GameState, difficulty: BotDifficulty): number {
  const extra = Math.max(0, state.players.length - 2);
  return settings[difficulty].margin + (difficulty === "easy" ? 0 : difficulty === "hard" ? Math.floor(extra / 2) : extra);
}

// Expert is explicitly allowed to inspect hidden treasure values.
function actualValue(items: TreasureBundle[]): number {
  return items.reduce((sum,b)=>sum+b.treasures.reduce((v,t)=>v+t.value,0),0);
}
function bankedScore(p: Player): number { return p.collected.reduce((v,t)=>v+t.value,0); }
function securedScore(p: Player): number { return bankedScore(p)+(p.diver.returned?actualValue(p.cargo):0); }
function compare(a: Player,b: Player): number {
  let diff=bankedScore(a)-bankedScore(b);
  for(let l=4;l>=1&&!diff;l--)diff=a.collected.filter(t=>t.level===l).length-b.collected.filter(t=>t.level===l).length;
  return diff;
}

// Learn only from actual observed decisions, never simulated actions or hidden difficulty.
const opponentPolicies = ["easy", "normal", "hard"] as const;
const opponentEvidence = new Map<string, number[]>();
// Actual committed rolls only; never updated by speculative simulations.
const rollHistory = new Map<string, {round:number; count:number}>();
export function resetOpponentModel(): void { opponentEvidence.clear(); rollHistory.clear(); }
function rollCount(state: GameState, id: string): number {
  const entry = rollHistory.get(id);
  return entry?.round === state.round ? entry.count : 0;
}
export function recordCommittedRoll(state: GameState, action: GameAction): void {
  if(state.phase !== "playing" || state.turnStage !== "swim" || action.type !== "ROLL_DICE") return;
  const id = getCurrentPlayer(state).id;
  rollHistory.set(id,{round:state.round,count:rollCount(state,id)+1});
}
// Final-turn rescue only: choose uniformly among totals that reach the submarine.
function forcedExpertDice(state: GameState, player: Player, random: () => number = Math.random): DiceResult | undefined {
  if (!state.lastTurn || player.diver.direction !== "inward") return undefined;
  const totals = [2, 3, 4, 5, 6].filter(total =>
    getMovementPath(state, player, calculateMovement(total, player.cargo.length)).at(-1) === 0
  );
  if (!totals.length || totals.length === 5) return undefined;
  const total = totals[Math.floor(random() * totals.length)];
  const pairs = [1, 2, 3].filter(first => total - first >= 1 && total - first <= 3);
  const first = pairs[Math.floor(random() * pairs.length)];
  return { first, second: total - first, total };
}
export function observeBotOpponentAction(state: GameState, action: GameAction): void {
  if (state.phase !== "playing" || (state.turnStage !== "declare" && state.turnStage !== "treasure")) return;
  const p = getCurrentPlayer(state);
  const signature = (a: GameAction | null) => JSON.stringify(a);
  const predictions = opponentPolicies.map(policy => signature(chooseBotAction(state, policy)));
  if (predictions.every(a => a === predictions[0])) return;
  const prior = opponentEvidence.get(p.id) ?? [0,0,0];
  opponentEvidence.set(p.id, prior.map((v,i) => v * .94 + (predictions[i] === signature(action) ? 0 : -2)));
}
function opponentWeights(id: string): number[] {
  const evidence = opponentEvidence.get(id) ?? [0,0,0];
  const max = Math.max(...evidence);
  const weights = evidence.map(v=>Math.exp(v-max));
  const sum = weights.reduce((a,b)=>a+b,0);
  return weights.map(v=>.94*v/sum+.02);
}
function forecastPolicy(id:string, u:number): BotDifficulty {
  const w=opponentWeights(id);
  return opponentPolicies[u<w[0]?0:u<w[0]+w[1]?1:2];
}

// One objective, rather than conflicting risk thresholds and cargo targets.
// A cheap continuation policy evaluates real cargo value and return probability.
type RolloutStyle = "conservative" | "balanced" | "aggressive" | "denial";
const rolloutStyles: RolloutStyle[] = ["conservative","balanced","aggressive","denial"];
function expertContinuation(s: GameState,p:Player,style:RolloutStyle):GameAction {
  const cargo=p.cargo, n=cargo.length;
  const appetite = {conservative:.55,balanced:1.15,aggressive:2.7,denial:1.5}[style];
  if(s.turnStage==='breathe')return {type:'START_TURN'};
  const h=hardEvaluator(s,p);
  const rivals=s.players.filter(q=>q.id!==p.id);
  const target=Math.max(...rivals.map(q=>securedScore(q)+(q.diver.returned?0:actualValue(q.cargo))));
  const need=Math.max(0,target+1-bankedScore(p));
  const lead=s.round===3&&rivals.every(q=>bankedScore(p)>securedScore(q));
  const value=(items:TreasureBundle[],immediate=false,out=false)=>{
    const v=actualValue(items), chance=h.prob(items,immediate,out);
    return chance*(v+(s.round===3&&v>=need?12:0));
  };
  if(s.turnStage==='declare'){
    if(s.lastTurn||p.diver.position>=s.track.length)return {type:'DECLARE_DIRECTION',turnBack:true};
    const back=h.prob(cargo,true), forward=h.prob(cargo,true,true);
    const v=actualValue(cargo);
    const future=s.track.slice(p.diver.position,p.diver.position+6).flatMap(t=>t.bundle?[actualValue([t.bundle])]:[]);
    const gain=future.length?future.reduce((a,b)=>a+b,0)/6:0;
    const enough=s.round===3&&n>0&&v>=need;
    const turn=n>0&&(enough&&back>=.65 || n>=5 || (back*(v+.5)>forward*(v+gain*appetite+.5)) || n>=2&&back<.5);
    return {type:'DECLARE_DIRECTION',turnBack:lead&&style==='denial'&&n<4&&s.oxygen>0?false:turn};
  }
  let best:GameAction={type:'SKIP_TREASURE'}, u=value(cargo);
  if(s.lastTurn)return best;
  const bundle=s.track[p.diver.position-1]?.bundle;
  if(bundle&&n<5&&canPickUpTreasure(s,p)){
    const next=[...cargo,bundle], v=value(next);
    const denial = style==='denial' && n<4 && (lead || (p.diver.direction==='inward' && p.diver.position<=2 && h.prob(next,false)>=.65));
    const aggressive = style==='aggressive' && p.diver.direction==='outward' && n<3 && actualValue([bundle])>=5 && h.prob(next,false)>=.35;
    if(v>u || denial || aggressive){best={type:'PICK_UP_TREASURE'};u=v;}
  }
  if(canDropTreasure(s,p))for(const b of cargo){const v=value(cargo.filter(t=>t.id!==b.id));if(v>u){best={type:'DROP_TREASURE',bundleId:b.id};u=v;}}
  return best;
}
function expertRollout(state: GameState,player:Player,actions:GameAction[]):GameAction {
  // Screen all four strategies on common random scenarios, then validate the best
  // strategy for each action on a separate set. Do not select strategies with hindsight.
  const screenSamples=6, validationSamples=12;
  const seed=(state.round*100003+state.oxygen*7919+player.diver.position*101+state.players.reduce((a,p)=>a+p.diver.position*31+p.cargo.length*17,0))>>>0;
  function evaluate(action:GameAction,style:RolloutStyle,offset:number,samples:number){
    let utility=0,wins=0;
    for(let k=offset;k<offset+samples;k++){
      const streams=state.players.map((_,i)=>{let d=(seed+Math.imul(k+1,2654435761)+Math.imul(i+1,2246822519))>>>0;return()=>{d=(Math.imul(d,1664525)+1013904223)>>>0;return d/4294967296;};});
      const policies=state.players.map((p,i)=>forecastPolicy(p.id,((k+.5)/24+i*.381966)%1));
      let s=applyAction(state,action);
      for(let step=0;s.phase==='playing'&&step<500;step++){
        const p=getCurrentPlayer(s);let a:GameAction;
        if(s.turnStage==='swim'){
          const r=streams[s.currentPlayerIndex],first=1+Math.floor(r()*3),second=1+Math.floor(r()*3);
          const dice=p.id===player.id?forcedExpertDice(s,p,r)??{first,second,total:first+second}:{first,second,total:first+second};
          a={type:'ROLL_DICE',dice};
        } else if(p.id===player.id)a=expertContinuation(s,p,style);
        else a=chooseBotAction(s,policies[s.currentPlayerIndex])!;
        s=applyAction(s,a);
      }
      if(s.phase==='playing'){utility-=100;continue;}
      const own=s.players.find(p=>p.id===player.id)!,rivals=s.players.filter(p=>p.id!==player.id);
      const lead=bankedScore(own)-Math.max(...rivals.map(bankedScore));
      wins+=rivals.every(p=>compare(own,p)>=0)?1/(1+rivals.filter(p=>compare(own,p)===0).length):0;
      utility+=state.round===3?lead:bankedScore(own)-.8*Math.max(...rivals.map(bankedScore));
    }
    return {utility:utility/samples,wins:wins/samples};
  }
  type Evaluation=ReturnType<typeof evaluate>;
  const better=(a:Evaluation,b:Evaluation)=>state.round===3?a.wins>b.wins||a.wins===b.wins&&a.utility>b.utility:a.utility>b.utility;
  let best=actions[0],bestEvaluation:Evaluation={utility:-Infinity,wins:-1};
  for(const action of actions){
    let selected=rolloutStyles[0],screen:Evaluation={utility:-Infinity,wins:-1};
    for(const style of rolloutStyles){const e=evaluate(action,style,0,screenSamples);if(better(e,screen)){screen=e;selected=style;}}
    const validated=evaluate(action,selected,screenSamples,validationSamples);
    if(better(validated,bestEvaluation)){best=action;bestEvaluation=validated;}
  }
  return best;
}

function hardEvaluator(state: GameState, player: Player, reserve = 0) {
  const dice = [2,3,3,4,4,4,5,5,6];
  const opponents = state.players.filter(p=>p.id!==player.id&&!p.diver.returned);
  const forecast = opponents.map(p=>({n:p.cargo.length, turns:Math.max(1,Math.ceil(p.diver.position/Math.max(0.5,4-p.cargo.length)))+(p.diver.direction==='outward'?1:0)}));
  const memo = new Map<string,number>();
  function chance(pos:number,n:number,oxygen:number,cycle:number,immediate:boolean,out:boolean):number {
    if(pos===0&&!out)return 1;
    if(cycle>=40||(!immediate&&state.lastTurn))return 0;
    const key=[pos,n,oxygen,cycle,+immediate,+out].join(',');
    const saved=memo.get(key);if(saved!==undefined)return saved;
    const before=oxygen-(immediate?0:forecast.reduce((s,p)=>s+(cycle<p.turns?p.n:0),0));
    if(!immediate&&before<=0)return 0;
    const left=before-(immediate?0:n);
    let sum=0;
    for(const d of dice){
      const diver:Player={...player,diver:{...player.diver,position:pos,direction:out?'outward':'inward'}};
      const path=getMovementPath(state,diver,calculateMovement(d,n));
      const landing=path.at(-1)??pos;
      sum+=landing===0?1:left<=0||state.lastTurn?0:chance(landing,n,left,cycle+1,false,false);
    }
    memo.set(key,sum/9);return sum/9;
  }
  return {prob:(items:TreasureBundle[],immediate:boolean,out=false)=>chance(player.diver.position,items.length,state.oxygen-reserve,0,immediate,out),utility:(items:TreasureBundle[])=>chance(player.diver.position,items.length,state.oxygen-reserve,0,false,false)*expectedValue(items)};
}

export function chooseBotAction(state: GameState, difficulty: BotDifficulty = "normal"): GameAction | null {
  if (state.phase === "round-ended") return { type: "NEXT_ROUND" };
  if (state.phase !== "playing") return null;
  const player = getCurrentPlayer(state);
  const cargo = player.cargo;
  const advanced = difficulty === "hard" || difficulty === "expert";
  const config = settings[difficulty];
  const baseMargin = dynamicMargin(state, difficulty);
  const margin = baseMargin - (advanced && trailing(state,player) ? 3 : 0);
  const target = difficulty === "expert" ? 5 : config.target + (advanced && trailing(state,player) ? 1 : 0);
  const cost = (items: TreasureBundle[]) => returnCost(state,player,items,advanced);
  switch (state.turnStage) {
    case "breathe": return { type: "START_TURN" };
    case "swim": {
      const dice=difficulty==="expert"?forcedExpertDice(state,player):undefined;
      return dice?{type:"ROLL_DICE",dice}:{type:"ROLL_DICE"};
    }
    case "declare": {
      const canTurn = player.diver.position > 0 && !player.diver.hasTurned && player.diver.direction === "outward";
      let turnBack = state.lastTurn || player.diver.position >= state.track.length || (cargo.length > 0 && (cargo.length >= target || state.oxygen <= cost(cargo) + margin));
      if (difficulty === "hard" && canTurn && !state.lastTurn && player.diver.position < state.track.length) {
        const h=hardEvaluator(state,player,baseMargin-settings.hard.margin);
        const back=h.prob(cargo,true), forward=h.prob(cargo,true,true);
        turnBack=cargo.length>=target || (cargo.length>0 && (state.oxygen<=cost(cargo)+margin || (forward<.45 && back>.65)));
      }
      if (difficulty === "expert" && canTurn && !state.lastTurn && player.diver.position < state.track.length) {
        return expertRollout(state,player,[{type:"DECLARE_DIRECTION",turnBack:true},{type:"DECLARE_DIRECTION",turnBack:false}]);
      }
      return { type: "DECLARE_DIRECTION", turnBack: canTurn && turnBack };
    }
    case "treasure": {
      if (state.lastTurn) return { type: "SKIP_TREASURE" };
      const tile = state.track[player.diver.position - 1];
      const candidates: { action: GameAction; cargo: TreasureBundle[] }[] = [{action:{type:"SKIP_TREASURE"},cargo}];
      if (canPickUpTreasure(state,player) && tile?.bundle && (cargo.length < target || (difficulty === "hard" && cargo.length < 3 && state.oxygen >= 17) || (difficulty === "expert" && player.diver.direction === "inward" && player.diver.position <= 2 && cargo.length < 3))) {
        candidates.push({action:{type:"PICK_UP_TREASURE"},cargo:[...cargo,tile.bundle]});
      }
      if (canDropTreasure(state,player)) for (const bundle of cargo) {
        candidates.push({action:{type:"DROP_TREASURE",bundleId:bundle.id},cargo:cargo.filter(b=>b.id!==bundle.id)});
      }
      if (difficulty === "hard") {
        const h=hardEvaluator(state,player,baseMargin-settings.hard.margin);
        const currentChance=h.prob(cargo,false);
        const pick=candidates.find(c=>c.action.type==="PICK_UP_TREASURE");
        if(pick && !(player.diver.direction==="outward" && cargo.length===0 && state.oxygen>=19 && tile?.bundle?.treasures.every(t=>t.level===1))) {
          const chance=h.prob(pick.cargo,false);
          if(cargo.length===0 || (cargo.length<2 && player.diver.direction==="outward") || (cargo.length<2 && h.utility(pick.cargo)>h.utility(cargo)) || (cargo.length===2 && chance>=.85 && h.utility(pick.cargo)>h.utility(cargo))) return pick.action;
        }
        const drop=candidates.filter(c=>c.action.type==="DROP_TREASURE" && cargo.length>=2 && player.diver.direction==="inward" && currentChance<.35 && h.prob(c.cargo,false)-currentChance>=.4 && h.utility(c.cargo)>h.utility(cargo)*1.5).sort((a,b)=>h.utility(b.cargo)-h.utility(a.cargo))[0];
        return drop?.action ?? {type:"SKIP_TREASURE"};
      }
      if (difficulty === "expert") {
        return expertRollout(state,player,candidates.map(c=>c.action));
      }
      if(difficulty === "normal") {
        const pick=candidates.find(c=>c.action.type==="PICK_UP_TREASURE");
        if(pick && !(player.diver.direction==="outward" && cargo.length===0 && state.oxygen>=19 && tile?.bundle?.treasures.every(t=>t.level===1)) && (cargo.length===0 || player.diver.direction==="outward" || state.oxygen>cost(pick.cargo)+margin)) return pick.action;
        return {type:"SKIP_TREASURE"};
      }
      const drops = candidates.filter(c=>c.action.type === "DROP_TREASURE").sort((a,b)=>expectedValue(b.cargo)-expectedValue(a.cargo));
      if (drops.length && (cargo.length >= 4 || (difficulty !== "easy" && state.oxygen <= cost(cargo)+margin))) return drops[0].action;
      const pick = candidates.find(c=>c.action.type === "PICK_UP_TREASURE");
      if (pick && (difficulty === "easy" || cargo.length === 0 || (!advanced && player.diver.direction === "outward") || state.oxygen > cost(pick.cargo)+margin)) return pick.action;
      return {type:"SKIP_TREASURE"};
    }
  }
}
