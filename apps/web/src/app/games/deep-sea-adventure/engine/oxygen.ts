
import type { GameState, PlayerId } from "../types";

/**
 * Each carried treasure bundle counts as one unit of oxygen.
 * A bundle may contain multiple stacked treasure chips.
 */
export function calculateOxygenCost(cargoCount: number): number {
  if (!Number.isInteger(cargoCount) || cargoCount < 0) {
    throw new Error("Cargo count must be a non-negative integer.");
  }

  return cargoCount;
}

/**
 * Consume oxygen at the beginning of the current player's turn.
 *
 * If oxygen reaches zero or below, lastTurn becomes true.
 * The current player must still finish their turn.
 */
export function consumeOxygen(
  state: GameState,
  playerId: PlayerId,
): GameState {
  if (state.lastTurn) {
    throw new Error("The final turn has already started.");
  }

  const currentPlayer = state.players[state.currentPlayerIndex];

  if (!currentPlayer || currentPlayer.id !== playerId) {
    throw new Error("Only the current player can consume oxygen.");
  }

  if (currentPlayer.diver.returned) {
    throw new Error("A returned diver cannot take another turn.");
  }

  const oxygenCost = calculateOxygenCost(
    currentPlayer.cargo.length,
  );

  const nextOxygen = state.oxygen - oxygenCost;

  return {
    ...state,
    oxygen: nextOxygen,
    lastTurn: nextOxygen <= 0,
  };
}
