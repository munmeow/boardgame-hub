
import { GAME_RULES } from "../rules/constants";

import type {
  GameState,
  DiceResult,
  TurnStage,
} from "../types";

import {
  getCurrentPlayer,
  getNextPlayerIndex,
  shouldEndRound,
} from "./state";

import { consumeOxygen } from "./oxygen";

import {
  calculateMovement,
  moveDiver,
} from "./movement";

import {
  pickUpTreasure,
  dropTreasure,
} from "./treasure";

import { endRound } from "./round";

function requireStage(
  state: GameState,
  stage: TurnStage,
): void {
  if (state.phase !== "playing") {
    throw new Error("The game is not currently playing.");
  }

  if (state.turnStage !== stage) {
    throw new Error(
      `Expected stage: ${stage}. Current stage: ${state.turnStage}.`,
    );
  }
}

/**
 * Stage 1: Consume oxygen.
 */
export function startTurn(
  state: GameState,
): GameState {
  requireStage(state, "breathe");

  const player = getCurrentPlayer(state);

  const updatedState = consumeOxygen(
    state,
    player.id,
  );

  return {
    ...updatedState,
    turnStage:
      player.diver.position === 0 ||
      player.diver.hasTurned ||
      player.diver.direction === "inward"
        ? "swim"
        : "declare",
    diceResult: null,
  };
}

/**
 * Stage 2: Declare whether to turn back.
 */
export function declareDirection(
  state: GameState,
  turnBack: boolean,
): GameState {
  requireStage(state, "declare");

  const player = getCurrentPlayer(state);

  if (turnBack) {
    if (
      player.diver.hasTurned ||
      player.diver.direction === "inward"
    ) {
      throw new Error(
        "A diver can only turn back once per round.",
      );
    }

    if (player.diver.position === 0) {
      throw new Error(
        "The diver cannot turn back at the submarine.",
      );
    }
  }

  const updatedPlayers = state.players.map(
    (item) =>
      item.id === player.id && turnBack
        ? {
            ...item,
            diver: {
              ...item.diver,
              direction: "inward" as const,
              hasTurned: true,
            },
          }
        : item,
  );

  return {
    ...state,
    players: updatedPlayers,
    turnStage: "swim",
  };
}

/**
 * Roll two special dice, each with values 1–3.
 */
export function rollDice(
  random: () => number = Math.random,
): DiceResult {
  const roll = () =>
    Math.floor(
      random() *
        (
          GAME_RULES.DICE_MAX -
          GAME_RULES.DICE_MIN +
          1
        ),
    ) + GAME_RULES.DICE_MIN;

  const first = roll();
  const second = roll();

  return {
    first,
    second,
    total: first + second,
  };
}

function validateDice(dice: DiceResult): void {
  const values = [dice.first, dice.second];

  const valid = values.every(
    (value) =>
      Number.isInteger(value) &&
      value >= GAME_RULES.DICE_MIN &&
      value <= GAME_RULES.DICE_MAX,
  );

  if (
    !valid ||
    dice.total !== dice.first + dice.second
  ) {
    throw new Error("Invalid dice result.");
  }
}

/**
 * Stage 3: Roll dice and move the current diver.
 */
export function swim(
  state: GameState,
  dice: DiceResult = rollDice(),
): GameState {
  // Rolling without declaring means continuing
  // in the current direction.
  const preparedState =
    state.turnStage === "declare"
      ? declareDirection(state, false)
      : state;

  requireStage(preparedState, "swim");
  validateDice(dice);

  const player = getCurrentPlayer(preparedState);

  const steps = calculateMovement(
    dice.total,
    player.cargo.length,
  );

  const movedState = moveDiver(
    preparedState,
    player,
    steps,
  );

  const movedPlayer = getCurrentPlayer(movedState);

  const updatedState: GameState = {
    ...movedState,
    diceResult: dice,
    turnStage: "treasure",
  };

  // A returned diver cannot perform treasure actions.
  if (movedPlayer.diver.returned) {
    return finishTurn({
      ...updatedState,
      lastReturnPlayerIndex:
        movedState.currentPlayerIndex,
    });
  }

  return updatedState;
}

/**
 * Finish the current player's turn.
 */
function finishTurn(
  state: GameState,
): GameState {
  requireStage(state, "treasure");

  if (shouldEndRound(state)) {
    return endRound(state);
  }

  const nextPlayerIndex =
    getNextPlayerIndex(state);

  if (nextPlayerIndex === null) {
    return endRound(state);
  }

  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    turnStage: "breathe",
    diceResult: null,
  };
}

/**
 * Stage 4: Pick up treasure and finish the turn.
 */
export function takeTreasure(
  state: GameState,
): GameState {
  requireStage(state, "treasure");

  const player = getCurrentPlayer(state);

  const updatedState = pickUpTreasure(
    state,
    player.id,
  );

  return finishTurn(updatedState);
}

/**
 * Stage 4: Drop treasure and finish the turn.
 */
export function leaveTreasure(
  state: GameState,
  bundleId: string,
): GameState {
  requireStage(state, "treasure");

  const player = getCurrentPlayer(state);

  const updatedState = dropTreasure(
    state,
    player.id,
    bundleId,
  );

  return finishTurn(updatedState);
}

/**
 * Stage 4: Do nothing and finish the turn.
 */
export function skipTreasure(
  state: GameState,
): GameState {
  requireStage(state, "treasure");

  return finishTurn(state);
}
