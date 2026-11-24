
import { describe, it, expect } from "vitest";
import { setupGame } from "../engine/setup";

describe("Deep Sea Adventure - Setup", () => {
  const game = setupGame(["Player 1", "Player 2"]);

  it("creates the correct number of players", () => {
    expect(game.players).toHaveLength(2);
  });

  it("starts with 25 oxygen", () => {
    expect(game.oxygen).toBe(25);
  });

  it("starts at round 1", () => {
    expect(game.round).toBe(1);
  });

  it("creates exactly 32 treasure tiles", () => {
    expect(game.track).toHaveLength(32);
    expect(game.track.every((tile) => tile.type === "treasure")).toBe(true);
  });

  it("keeps treasure levels in ascending order", () => {
    const levels = game.track.map(
      (tile) => tile.bundle!.treasures[0].level,
    );

    expect(levels).toEqual([
      ...Array(8).fill(1),
      ...Array(8).fill(2),
      ...Array(8).fill(3),
      ...Array(8).fill(4),
    ]);
  });

  it("creates every treasure value exactly twice", () => {
    const treasures = game.track.flatMap(
      (tile) => tile.bundle?.treasures ?? [],
    );

    for (let value = 0; value <= 15; value++) {
      expect(
        treasures.filter((treasure) => treasure.value === value),
      ).toHaveLength(2);
    }
  });

  it("rejects an invalid number of players", () => {
    expect(() => setupGame(["Only one player"])).toThrow();
    expect(() =>
      setupGame(["1", "2", "3", "4", "5", "6", "7"]),
    ).toThrow();
  });

  it("rejects empty player names", () => {
    expect(() => setupGame(["Player 1", "   "])).toThrow();
  });
});
