
import type { GameState } from "../types";
import type { GameAction } from "../engine/actions";

import { getCurrentPlayer } from "../engine/state";

import {
  canPickUpTreasure,
  canDropTreasure,
} from "../engine/treasure";

export type BotDifficulty =
  | "easy"
  | "normal"
  | "hard";

function shouldTurnBack(
  state: GameState,
  difficulty: BotDifficulty,
): boolean {
  const player = getCurrentPlayer(state);

  if (
    player.diver.hasTurned ||
    player.diver.position === 0
  ) {
    return false;
  }

  const cargoCount = player.cargo.length;

  const averageMovement = Math.max(
    0.5,
    4 - cargoCount,
  );

  const estimatedTurns = Math.ceil(
    player.diver.position / averageMovement,
  );

  const oxygenPerCycle = state.players
    .filter((item) => !item.diver.returned)
    .reduce(
      (total, item) => total + item.cargo.length,
      0,
    );

  const safetyMargin =
    difficulty === "easy"
      ? 0
      : difficulty === "normal"
        ? 3
        : 6;

  const requiredOxygen =
    estimatedTurns * oxygenPerCycle +
    safetyMargin;

  const targetCargo =
    difficulty === "easy" ? 3 : 2;

  return (
    state.lastTurn ||
    state.oxygen <= requiredOxygen ||
    cargoCount >= targetCargo ||
    player.diver.position >= state.track.length
  );
}

export function chooseBotAction(
  state: GameState,
  difficulty: BotDifficulty = "normal",
): GameAction | null {
  if (state.phase === "finished") {
    return null;
  }

  if (state.phase === "round-ended") {
    return { type: "NEXT_ROUND" };
  }

  if (state.phase !== "playing") {
    return null;
  }

  const player = getCurrentPlayer(state);

  switch (state.turnStage) {
    case "breathe":
      return { type: "START_TURN" };

    case "declare":
      return {
        type: "DECLARE_DIRECTION",
        turnBack: shouldTurnBack(
          state,
          difficulty,
        ),
      };

    case "swim":
      return { type: "ROLL_DICE" };

    case "treasure": {
      const cargoCount = player.cargo.length;

      const estimatedMovement = Math.max(
        0.5,
        4 - cargoCount,
      );

      const activePlayers = state.players.filter(
        (item) => !item.diver.returned,
      );

      const oxygenPerCycle = activePlayers.reduce(
        (sum, item) => sum + item.cargo.length,
        0,
      );

      const estimatedReturnCost =
        Math.ceil(
          player.diver.position /
            estimatedMovement,
        ) * oxygenPerCycle;

      if (
        canDropTreasure(state, player) &&
        (
          cargoCount >= 4 ||
          state.oxygen < estimatedReturnCost
        )
      ) {
        // Choose using visible levels, not hidden values.
        const selectedBundle = [...player.cargo]
          .sort((a, b) => {
            const levelA = a.treasures.reduce(
              (sum, treasure) =>
                sum + treasure.level,
              0,
            );

            const levelB = b.treasures.reduce(
              (sum, treasure) =>
                sum + treasure.level,
              0,
            );

            return levelA - levelB;
          })[0];

        return {
          type: "DROP_TREASURE",
          bundleId: selectedBundle.id,
        };
      }

      const maxCargo =
        difficulty === "easy" ? 3 : 2;

      const safeToPickUp =
        player.diver.direction === "outward" ||
        state.oxygen >
          estimatedReturnCost + 4;

      if (
        !state.lastTurn &&
        cargoCount < maxCargo &&
        safeToPickUp &&
        canPickUpTreasure(state, player)
      ) {
        return { type: "PICK_UP_TREASURE" };
      }

      return { type: "SKIP_TREASURE" };
    }
  }
}
