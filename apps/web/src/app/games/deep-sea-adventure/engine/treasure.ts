
import { GAME_RULES } from "../rules/constants";
import type {
  GameState,
  Player,
  PlayerId,
  TrackTile,
} from "../types";

/**
 * Get the current player and validate their identity.
 */
function getTreasurePlayer(
  state: GameState,
  playerId: PlayerId,
): Player {
  if (state.phase !== "playing") {
    throw new Error("The game is not currently playing.");
  }

  const player = state.players[state.currentPlayerIndex];

  if (!player || player.id !== playerId) {
    throw new Error("Only the current player can perform this action.");
  }

  if (player.diver.returned) {
    throw new Error("The diver has already returned.");
  }

  return player;
}

/**
 * Convert diver position to track array index.
 */
function getTileIndex(player: Player): number {
  return player.diver.position - 1;
}

/**
 * Check whether the player can pick up treasure.
 */
export function canPickUpTreasure(
  state: GameState,
  player: Player,
): boolean {
  if (
    state.phase !== "playing" ||
    state.players[state.currentPlayerIndex]?.id !== player.id ||
    player.diver.returned ||
    player.diver.position <= 0
  ) {
    return false;
  }

  const tile = state.track[getTileIndex(player)];

  const usedBlankTiles = state.track.filter(
    (item) => item.type === "blank",
  ).length;

  return (
    tile !== undefined &&
    tile.type === "treasure" &&
    tile.bundle !== null &&
    usedBlankTiles < GAME_RULES.BLANK_TILES
  );
}

/**
 * Check whether the player can drop treasure.
 */
export function canDropTreasure(
  state: GameState,
  player: Player,
): boolean {
  if (
    state.phase !== "playing" ||
    state.players[state.currentPlayerIndex]?.id !== player.id ||
    player.diver.returned ||
    player.diver.position <= 0 ||
    player.cargo.length === 0
  ) {
    return false;
  }

  const tile = state.track[getTileIndex(player)];

  return (
    tile !== undefined &&
    tile.type === "blank" &&
    tile.bundle === null
  );
}

/**
 * Pick up the treasure bundle at the player's position.
 */
export function pickUpTreasure(
  state: GameState,
  playerId: PlayerId,
): GameState {
  const player = getTreasurePlayer(state, playerId);

  if (!canPickUpTreasure(state, player)) {
    throw new Error("Cannot pick up treasure at this position.");
  }

  const tileIndex = getTileIndex(player);
  const tile = state.track[tileIndex];
  const bundle = tile.bundle;

  if (!bundle) {
    throw new Error("Treasure bundle does not exist.");
  }

  // Replace the treasure with a blank tile.
  const updatedTrack = state.track.map(
    (item, index): TrackTile =>
      index === tileIndex
        ? {
            ...item,
            type: "blank",
            bundle: null,
          }
        : item,
  );

  // Add the entire bundle to the player's cargo.
  const updatedPlayers = state.players.map((item) =>
    item.id === playerId
      ? {
          ...item,
          cargo: [...item.cargo, bundle],
        }
      : item,
  );

  return {
    ...state,
    track: updatedTrack,
    players: updatedPlayers,
  };
}

/**
 * Drop a selected treasure bundle onto a blank tile.
 */
export function dropTreasure(
  state: GameState,
  playerId: PlayerId,
  bundleId: string,
): GameState {
  const player = getTreasurePlayer(state, playerId);

  if (!canDropTreasure(state, player)) {
    throw new Error("Cannot drop treasure at this position.");
  }

  const bundle = player.cargo.find(
    (item) => item.id === bundleId,
  );

  if (!bundle) {
    throw new Error("Treasure bundle not found in cargo.");
  }

  const tileIndex = getTileIndex(player);

  // Replace the blank tile with the selected bundle.
  const updatedTrack = state.track.map(
    (item, index): TrackTile =>
      index === tileIndex
        ? {
            ...item,
            type: "treasure",
            bundle,
          }
        : item,
  );

  // Remove the selected bundle from cargo.
  const updatedPlayers = state.players.map((item) =>
    item.id === playerId
      ? {
          ...item,
          cargo: item.cargo.filter(
            (cargoBundle) => cargoBundle.id !== bundleId,
          ),
        }
      : item,
  );

  return {
    ...state,
    track: updatedTrack,
    players: updatedPlayers,
  };
}
