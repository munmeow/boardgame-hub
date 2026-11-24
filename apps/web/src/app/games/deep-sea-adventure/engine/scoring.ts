
import type {
  GameState,
  Player,
  PlayerScore,
  TreasureLevel,
} from "../types";

export function calculateScore(
  player: Player,
): number {
  return player.collected.reduce(
    (total, treasure) => total + treasure.value,
    0,
  );
}

export function getPlayerScore(
  player: Player,
): PlayerScore {
  const levelCounts: Record<TreasureLevel, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  };

  for (const treasure of player.collected) {
    levelCounts[treasure.level]++;
  }

  return {
    playerId: player.id,
    name: player.name,
    score: calculateScore(player),
    treasureCount: player.collected.length,
    levelCounts,
  };
}

export function compareScores(
  a: PlayerScore,
  b: PlayerScore,
): number {
  // Primary condition: total treasure value.
  if (a.score !== b.score) {
    return b.score - a.score;
  }

  // Tie-break: compare higher treasure levels first.
  const levels: TreasureLevel[] = [4, 3, 2, 1];

  for (const level of levels) {
    const difference =
      b.levelCounts[level] - a.levelCounts[level];

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

export function getRankings(
  state: GameState,
): PlayerScore[] {
  return state.players
    .map(getPlayerScore)
    .sort(compareScores);
}

export function getWinners(
  state: GameState,
): PlayerScore[] {
  if (state.phase !== "finished") {
    throw new Error("The game has not finished.");
  }

  const rankings = getRankings(state);

  if (rankings.length === 0) {
    return [];
  }

  const first = rankings[0];

  return rankings.filter(
    (player) => compareScores(player, first) === 0,
  );
}
