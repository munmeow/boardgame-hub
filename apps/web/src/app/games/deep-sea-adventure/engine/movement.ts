
import type {
  GameState,
  Player,
} from "../types";

export function calculateMovement(
  diceTotal: number,
  cargoCount: number
): number {
  return Math.max(0, diceTotal - cargoCount);
}

export function moveDiver(
  state: GameState,
  player: Player,
  steps: number
): GameState {
  const players = state.players;
  const diver = player.diver;

  let position = diver.position;
  let remaining = steps;

  while (remaining > 0) {
    const nextPosition =
      position +
      (diver.direction === "outward" ? 1 : -1);

    // Không được đi vượt quá hai đầu đường.
    const boundedPosition = Math.max(
      0,
      Math.min(state.track.length, nextPosition)
    );

    if (boundedPosition === position) {
      break;
    }

    // Tàu ngầm là vị trí 0.
    if (boundedPosition === 0) {
      position = 0;
      break;
    }

    // Kiểm tra người chơi khác đang khám phá ô này.
    const occupied = players.some(
      (other) =>
        other.id !== player.id &&
        !other.diver.returned &&
        other.diver.position === boundedPosition
    );

    if (occupied) {
      // Nhảy qua ô đang bị chiếm, không trừ lượt di chuyển.
      position = boundedPosition;
      continue;
    }

    position = boundedPosition;
    remaining--;
  }

  const updatedPlayers = players.map((item) =>
    item.id === player.id
      ? {
          ...item,
          diver: {
            ...item.diver,
            position,
            returned: position === 0,
          },
        }
      : item
  );

  return {
    ...state,
    players: updatedPlayers,
  };
}
