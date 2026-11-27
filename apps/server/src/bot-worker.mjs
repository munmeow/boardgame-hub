import { parentPort, workerData } from 'node:worker_threads';
import { chooseBotAction, resetOpponentModel, observeBotOpponentAction, recordCommittedRoll } from '@boardgame-hub/abyss-relay/bot/bot';
try {
resetOpponentModel();
for(const {state,action} of workerData.history){if(action.type==='ROLL_DICE')recordCommittedRoll(state,action);else observeBotOpponentAction(state,action);}
parentPort.postMessage({kind:'bot:result',ok:true,action:chooseBotAction(workerData.state,workerData.difficulty)});
} catch(error) {
  parentPort.postMessage({kind:'bot:result',ok:false,error:error instanceof Error?error.message:String(error)});
}
