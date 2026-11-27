import type { GameState, Player, TreasureBundle } from "../types/index.js";
import { calculateMovement, getMovementPath } from "../engine/movement.js";

export function expectedValue(cargo: TreasureBundle[]): number {
  return cargo.reduce((sum, bundle) => sum + bundle.treasures.reduce(
    (value, treasure) => value + 4 * (treasure.level - 1) + 1.5, 0), 0);
}

// Estimate return probability using sampled dice and projected opponent oxygen.
// Opponent positions and cargo are held fixed; this is not a full game rollout.
export function returnProbability(state: GameState, player: Player,
  cargo: TreasureBundle[], outwardFirst: boolean, immediate: boolean,
  samples = 160, random = Math.random): number {
  const others = state.players.filter(p => p.id !== player.id && !p.diver.returned);
  const otherCost = others.reduce((sum, p) => sum + p.cargo.length, 0);
  let successes = 0;
  for (let trial = 0; trial < samples; trial++) {
    let oxygen = state.oxygen;
    let position = player.diver.position;
    for (let turn = 0; turn < 40; turn++) {
      if (!(immediate && turn === 0)) {
        oxygen -= otherCost;
        if (oxygen <= 0 || state.lastTurn) break;
        oxygen -= cargo.length;
      }
      const diver: Player = { ...player, cargo, diver: { ...player.diver,
        position, direction: outwardFirst && turn === 0 ? "outward" : "inward" } };
      const dice = 2 + Math.floor(random() * 3) + Math.floor(random() * 3);
      const path = getMovementPath(state, diver, calculateMovement(dice, cargo.length));
      position = path[path.length - 1] ?? position;
      if (position === 0) { successes++; break; }
      if (oxygen <= 0 || state.lastTurn) break;
    }
  }
  return successes / samples;
}
