
import type {
  GameState,
  Player,
} from "../types/index.js";

export function calculateMovement(
  diceTotal: number,
  cargoCount: number,
): number {
  return Math.max(
    0,
    diceTotal - cargoCount,
  );
}

export function getMovementPath(
  state: GameState,
  player: Player,
  steps: number,
): number[] {
  const path: number[] = [];

  const diver = player.diver;

  let position = diver.position;
  let remaining = steps;

  const direction =
    diver.direction === "outward"
      ? 1
      : -1;

  while (remaining > 0) {
    const nextPosition =
      position + direction;

    const boundedPosition = Math.max(
      0,
      Math.min(
        state.track.length,
        nextPosition,
      ),
    );

    if (boundedPosition === position) {
      break;
    }

    if (boundedPosition === 0) {
      position = 0;
      path.push(0);
      break;
    }

    const occupied = state.players.some(
      (other) =>
        other.id !== player.id &&
        !other.diver.returned &&
        other.diver.position ===
          boundedPosition,
    );

    position = boundedPosition;

    if (occupied) {
      continue;
    }

    path.push(position);

    remaining--;
  }

  const lastPosition =
    path[path.length - 1] ??
    diver.position;

  if (lastPosition !== position) {
    path.push(position);
  }

  return path;
}

export function moveDiver(
  state: GameState,
  player: Player,
  steps: number,
): GameState {
  const path = getMovementPath(
    state,
    player,
    steps,
  );

  const position =
    path[path.length - 1] ??
    player.diver.position;

  const updatedPlayers = state.players.map(
    (item) =>
      item.id === player.id
        ? {
            ...item,
            diver: {
              ...item.diver,
              position,
              returned: position === 0,
            },
          }
        : item,
  );

  return {
    ...state,
    players: updatedPlayers,
  };
}
