
import type {
  GameState,
  Player,
  PlayerId,
} from "../types";

export function getCurrentPlayer(
  state: GameState,
): Player {
  const player = state.players[state.currentPlayerIndex];

  if (!player) {
    throw new Error("Current player does not exist.");
  }

  return player;
}

export function getPlayerById(
  state: GameState,
  playerId: PlayerId,
): Player {
  const player = state.players.find(
    (item) => item.id === playerId,
  );

  if (!player) {
    throw new Error("Player not found.");
  }

  return player;
}

export function getActivePlayers(
  state: GameState,
): Player[] {
  return state.players.filter(
    (player) => !player.diver.returned,
  );
}

export function getCargoCount(
  player: Player,
): number {
  return player.cargo.length;
}

export function getCargoValue(
  player: Player,
): number {
  return player.cargo.reduce(
    (total, bundle) =>
      total +
      bundle.treasures.reduce(
        (sum, treasure) => sum + treasure.value,
        0,
      ),
    0,
  );
}

export function getCollectedValue(
  player: Player,
): number {
  return player.collected.reduce(
    (total, treasure) => total + treasure.value,
    0,
  );
}

export function shouldEndRound(
  state: GameState,
): boolean {
  return (
    state.lastTurn ||
    state.players.every(
      (player) => player.diver.returned,
    )
  );
}

export function isRoundFinished(
  state: GameState,
): boolean {
  return (
    state.phase === "round-ended" ||
    state.phase === "finished"
  );
}

export function getNextPlayerIndex(
  state: GameState,
): number | null {
  const playerCount = state.players.length;

  for (let offset = 1; offset <= playerCount; offset++) {
    const index =
      (state.currentPlayerIndex + offset) % playerCount;

    if (!state.players[index].diver.returned) {
      return index;
    }
  }

  return null;
}
