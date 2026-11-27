
import { GAME_RULES } from "../rules/constants.js";
import { shouldEndRound } from "./state.js";

import type {
  GameState,
  Player,
  TrackTile,
  Treasure,
} from "../types/index.js";

/**
 * Sort unsuccessful divers from nearest to farthest
 * from the submarine.
 */
export function getFailedDivers(
  state: GameState,
): Player[] {
  return state.players
    .filter((player) => !player.diver.returned)
    .sort(
      (a, b) =>
        a.diver.position - b.diver.position,
    );
}

/**
 * Collect all treasures lost during the dive.
 */
export function getLostTreasures(
  state: GameState,
): Treasure[] {
  return getFailedDivers(state).flatMap(
    (player) =>
      player.cargo.flatMap(
        (bundle) => bundle.treasures,
      ),
  );
}

/**
 * Create new treasure stacks at the end of the track.
 */
export function createLostTreasureTiles(
  treasures: Treasure[],
): TrackTile[] {
  const tiles: TrackTile[] = [];

  for (
    let index = 0;
    index < treasures.length;
    index += GAME_RULES.MAX_STACK_SIZE
  ) {
    const stack = treasures.slice(
      index,
      index + GAME_RULES.MAX_STACK_SIZE,
    );

    tiles.push({
      id: crypto.randomUUID(),
      type: "treasure",
      bundle: {
        id: crypto.randomUUID(),
        treasures: stack,
      },
    });
  }

  return tiles;
}

/**
 * Remove blank tiles and close gaps in the track.
 */
export function removeBlankTiles(
  track: TrackTile[],
): TrackTile[] {
  return track.filter(
    (tile) => tile.type !== "blank",
  );
}

/**
 * Finish the current dive.
 */
export function endRound(
  state: GameState,
): GameState {
  if (state.phase !== "playing") {
    throw new Error("The round is not currently playing.");
  }

  if (!shouldEndRound(state)) {
    throw new Error("The round cannot end yet.");
  }

  const lostTreasures = getLostTreasures(state);

  const lostTiles =
    createLostTreasureTiles(lostTreasures);

  const updatedTrack = [
    ...removeBlankTiles(state.track),
    ...lostTiles,
  ];

  const updatedPlayers = state.players.map(
    (player): Player => ({
      ...player,

      collected: player.diver.returned
        ? [
            ...player.collected,
            ...player.cargo.flatMap(
              (bundle) => bundle.treasures,
            ),
          ]
        : player.collected,

      cargo: [],

      // Positions are reset because the track is compacted.
      diver: {
        ...player.diver,
        position: 0,
      },
    }),
  );

  const gameFinished =
    state.round >= GAME_RULES.TOTAL_ROUNDS;

  return {
    ...state,

    phase: gameFinished
      ? "finished"
      : "round-ended",

    players: updatedPlayers,
    track: updatedTrack,
    diceResult: null,
  };
}

/**
 * Prepare the next dive.
 */
export function startNextRound(
  state: GameState,
): GameState {
  if (state.phase !== "round-ended") {
    throw new Error("The previous round has not ended.");
  }

  if (state.round >= GAME_RULES.TOTAL_ROUNDS) {
    throw new Error("All rounds have been completed.");
  }

  const nextFirstPlayerIndex =
    state.lastReturnPlayerIndex ??
    state.firstPlayerIndex;

  const updatedPlayers = state.players.map(
    (player): Player => ({
      ...player,

      cargo: [],

      diver: {
        position: 0,
        direction: "outward",
        hasTurned: false,
        returned: false,
      },
    }),
  );

  return {
    ...state,

    phase: "playing",
    round: state.round + 1,
    oxygen: GAME_RULES.INITIAL_OXYGEN,

    players: updatedPlayers,

    firstPlayerIndex: nextFirstPlayerIndex,
    currentPlayerIndex: nextFirstPlayerIndex,
    lastReturnPlayerIndex: null,

    lastTurn: false,
    diceResult: null,
    turnStage: "breathe",
  };
}
