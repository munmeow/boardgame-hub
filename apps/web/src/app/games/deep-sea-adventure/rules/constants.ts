
import type { TreasureLevel } from "../types";

export const GAME_RULES = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,

  TOTAL_ROUNDS: 3,

  INITIAL_OXYGEN: 25,

  DICE_MIN: 1,
  DICE_MAX: 3,

  TREASURES_PER_LEVEL: 8,
  BLANK_TILES: 12,

  MAX_STACK_SIZE: 3,
} as const;

export const TREASURE_LEVELS: Record<
  TreasureLevel,
  {
    minValue: number;
    maxValue: number;
    shape: string;
  }
> = {
  1: {
    minValue: 0,
    maxValue: 3,
    shape: "triangle",
  },
  2: {
    minValue: 4,
    maxValue: 7,
    shape: "square",
  },
  3: {
    minValue: 8,
    maxValue: 11,
    shape: "pentagon",
  },
  4: {
    minValue: 12,
    maxValue: 15,
    shape: "hexagon",
  },
};
