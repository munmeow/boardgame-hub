
import { GAME_RULES } from "../rules/constants.js";
import type {
  GameState,
  Player,
  TrackTile,
  Treasure,
  TreasureBundle,
  TreasureLevel,
} from "../types/index.js";

function createId(): string {
  return crypto.randomUUID();
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function createTreasures(level: TreasureLevel): Treasure[] {
  const treasures: Treasure[] = [];
  const minValue = (level - 1) * 4;
  const maxValue = minValue + 3;

  for (let value = minValue; value <= maxValue; value++) {
    for (let copy = 0; copy < 2; copy++) {
      treasures.push({
        id: createId(),
        level,
        value,
      });
    }
  }

  return treasures;
}

function createBundle(treasure: Treasure): TreasureBundle {
  return {
    id: createId(),
    treasures: [treasure],
  };
}

function createTreasureTile(treasure: Treasure): TrackTile {
  return {
    id: createId(),
    type: "treasure",
    bundle: createBundle(treasure),
  };
}

function createTrack(random: () => number): TrackTile[] {
  const track: TrackTile[] = [];
  const levels: TreasureLevel[] = [1, 2, 3, 4];

  // Shuffle treasures within each level.
  // Keep the levels in ascending order.
  for (const level of levels) {
    const treasures = shuffle(createTreasures(level), random);

    for (const treasure of treasures) {
      track.push(createTreasureTile(treasure));
    }
  }

  // Blank tiles are NOT placed during initial setup.
  // They replace treasure tiles when players pick them up.
  return track;
}

function createPlayer(name: string, index: number): Player {
  return {
    id: `player-${index + 1}`,
    name: name.trim(),
    diver: {
      position: 0,
      direction: "outward",
      hasTurned: false,
      returned: false,
    },
    cargo: [],
    collected: [],
  };
}

function validatePlayerNames(playerNames: string[]): void {
  if (
    playerNames.length < GAME_RULES.MIN_PLAYERS ||
    playerNames.length > GAME_RULES.MAX_PLAYERS
  ) {
    throw new Error(
      `Player count must be between ${GAME_RULES.MIN_PLAYERS} and ${GAME_RULES.MAX_PLAYERS}.`,
    );
  }

  if (playerNames.some((name) => name.trim().length === 0)) {
    throw new Error("Player names cannot be empty.");
  }
}

export function setupGame(
  playerNames: string[],
  random: () => number = Math.random,
): GameState {
  validatePlayerNames(playerNames);

  const players = playerNames.map((name, index) =>
    createPlayer(name, index),
  );

  const track = createTrack(random);

  return {
    phase: "playing",
    round: 1,
    oxygen: GAME_RULES.INITIAL_OXYGEN,
    players,
    currentPlayerIndex: 0,
    firstPlayerIndex: 0,
    lastReturnPlayerIndex: null,
    track,
    lastTurn: false,
    diceResult: null,
    turnStage: "breathe",
  };
}
