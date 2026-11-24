
export type PlayerId = string;

export type Direction = "outward" | "inward";

export type GamePhase =
  | "setup"
  | "playing"
  | "round-ended"
  | "finished";

export type TurnStage =
  | "breathe"
  | "declare"
  | "swim"
  | "treasure";

export type TileType = "treasure" | "blank";

export type TreasureLevel = 1 | 2 | 3 | 4;

export interface Treasure {
  id: string;
  level: TreasureLevel;
  value: number;
}

export interface TreasureBundle {
  id: string;
  treasures: Treasure[];
}

export interface TrackTile {
  id: string;
  type: TileType;
  bundle: TreasureBundle | null;
}

export interface Diver {
  position: number;
  direction: Direction;
  hasTurned: boolean;
  returned: boolean;
}

export interface Player {
  id: PlayerId;
  name: string;
  diver: Diver;
  cargo: TreasureBundle[];
  collected: Treasure[];
}

export interface DiceResult {
  first: number;
  second: number;
  total: number;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  oxygen: number;

  players: Player[];

  currentPlayerIndex: number;
  firstPlayerIndex: number;

  // Last player who successfully returned this round.
  lastReturnPlayerIndex: number | null;

  track: TrackTile[];

  lastTurn: boolean;
  diceResult: DiceResult | null;
  turnStage: TurnStage;
}

export interface PlayerScore {
  playerId: PlayerId;
  name: string;
  score: number;
  treasureCount: number;
  levelCounts: Record<TreasureLevel, number>;
}
