
import type { GameState } from "../types";

import {
  startTurn,
  declareDirection,
  swim,
  takeTreasure,
  leaveTreasure,
  skipTreasure,
} from "./turn";

import { startNextRound } from "./round";

export type GameAction =
  | { type: "START_TURN" }
  | { type: "DECLARE_DIRECTION"; turnBack: boolean }
  | { type: "ROLL_DICE" }
  | { type: "PICK_UP_TREASURE" }
  | { type: "DROP_TREASURE"; bundleId: string }
  | { type: "SKIP_TREASURE" }
  | { type: "NEXT_ROUND" };

export function applyAction(
  state: GameState,
  action: GameAction,
): GameState {
  switch (action.type) {
    case "START_TURN":
      return startTurn(state);

    case "DECLARE_DIRECTION":
      return declareDirection(
        state,
        action.turnBack,
      );

    case "ROLL_DICE":
      return swim(state);

    case "PICK_UP_TREASURE":
      return takeTreasure(state);

    case "DROP_TREASURE":
      return leaveTreasure(
        state,
        action.bundleId,
      );

    case "SKIP_TREASURE":
      return skipTreasure(state);

    case "NEXT_ROUND":
      return startNextRound(state);

    default: {
      const exhaustiveCheck: never = action;

      throw new Error(
        `Unknown action: ${exhaustiveCheck}`,
      );
    }
  }
}
