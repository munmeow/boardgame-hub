// Validate worker messages at the boundary; never accept arbitrary action objects.
export function normalizeBotAction(message, state) {
  const action = message?.action ?? message;
  if (!action || typeof action !== 'object') return null;
  const stage = state.turnStage;
  switch (action.type) {
    case 'START_TURN': return stage === 'breathe' ? {type: action.type} : null;
    case 'DECLARE_DIRECTION': return stage === 'declare' && typeof action.turnBack === 'boolean' ? {type: action.type, turnBack: action.turnBack} : null;
    case 'ROLL_DICE': {
      if (stage !== 'swim') return null;
      const d = action.dice;
      if (d === undefined) return {type: action.type};
      if (!d || ![d.first,d.second].every(n=>Number.isInteger(n)&&n>=1&&n<=3) || d.total!==d.first+d.second) return null;
      return {type: action.type, dice: {first:d.first,second:d.second,total:d.total}};
    }
    case 'SKIP_TREASURE': case 'PICK_UP_TREASURE': return stage === 'treasure' ? {type:action.type} : null;
    case 'DROP_TREASURE': return stage === 'treasure' && typeof action.bundleId === 'string' ? {type:action.type,bundleId:action.bundleId} : null;
    default: return null;
  }
}
export function fallbackBotAction(state) {
  const p=state.players[state.currentPlayerIndex];
  switch(state.turnStage){
    case 'breathe': return {type:'START_TURN'};
    case 'declare': return {type:'DECLARE_DIRECTION',turnBack:p.diver.position>0&&!p.diver.hasTurned&&p.diver.direction==='outward'};
    case 'swim': return {type:'ROLL_DICE'};
    case 'treasure': return {type:'SKIP_TREASURE'};
    default: return null;
  }
}
