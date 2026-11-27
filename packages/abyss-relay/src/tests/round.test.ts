
import { describe, it, expect } from "vitest";

import { setupGame } from "../engine/setup.js";

import {
  endRound,
  startNextRound,
  createLostTreasureTiles,
  getFailedDivers,
} from "../engine/round.js";

import type { Treasure } from "../types/index.js";

describe("Deep Sea Adventure - Round", () => {
  it("does not end an active round prematurely", () => {
    const state = setupGame(["A", "B"]);

    expect(() => endRound(state)).toThrow();
  });

  it("ends the round when all divers return", () => {
    const state = setupGame(["A", "B"]);

    state.players.forEach((player) => {
      player.diver.returned = true;
    });

    const result = endRound(state);

    expect(result.phase).toBe("round-ended");
  });

  it("banks treasure from successful divers", () => {
    const state = setupGame(["A", "B"]);

    const bundle = state.track[0].bundle!;

    state.players[0].cargo = [bundle];
    state.players[0].diver.returned = true;

    state.track[0] = {
      ...state.track[0],
      type: "blank",
      bundle: null,
    };

    state.lastTurn = true;

    const result = endRound(state);

    expect(result.players[0].cargo).toHaveLength(0);

    expect(result.players[0].collected).toEqual(
      bundle.treasures,
    );
  });

  it("does not bank treasure from failed divers", () => {
    const state = setupGame(["A", "B"]);

    const bundle = state.track[0].bundle!;

    state.players[0].cargo = [bundle];
    state.players[0].diver.position = 5;

    state.track[0] = {
      ...state.track[0],
      type: "blank",
      bundle: null,
    };

    state.lastTurn = true;

    const result = endRound(state);

    expect(result.players[0].collected).toHaveLength(0);
    expect(result.players[0].cargo).toHaveLength(0);

    expect(
      result.track[result.track.length - 1]
        .bundle?.treasures,
    ).toEqual(bundle.treasures);
  });

  it("sorts failed divers by distance", () => {
    const state = setupGame(["A", "B", "C"]);

    state.players[0].diver.position = 8;
    state.players[1].diver.position = 2;
    state.players[2].diver.position = 5;

    expect(
      getFailedDivers(state).map(
        (player) => player.name,
      ),
    ).toEqual(["B", "C", "A"]);
  });

  it("creates stacks of three lost treasures", () => {
    const treasures: Treasure[] = Array.from(
      { length: 7 },
      (_, index) => ({
        id: `treasure-${index}`,
        level: 1,
        value: index % 4,
      }),
    );

    const tiles =
      createLostTreasureTiles(treasures);

    expect(tiles).toHaveLength(3);

    expect(
      tiles.map(
        (tile) => tile.bundle?.treasures.length,
      ),
    ).toEqual([3, 3, 1]);
  });

  it("removes all blank tiles", () => {
    const state = setupGame(["A", "B"]);

    state.track[0] = {
      ...state.track[0],
      type: "blank",
      bundle: null,
    };

    state.lastTurn = true;

    const result = endRound(state);

    expect(result.track).toHaveLength(31);

    expect(
      result.track.every(
        (tile) => tile.type === "treasure",
      ),
    ).toBe(true);
  });

  it("resets oxygen and starts the next round", () => {
    const state = setupGame(["A", "B"]);

    state.lastTurn = true;
    state.oxygen = 0;

    const result = startNextRound(
      endRound(state),
    );

    expect(result.round).toBe(2);
    expect(result.oxygen).toBe(25);
    expect(result.phase).toBe("playing");
    expect(result.turnStage).toBe("breathe");
    expect(result.lastTurn).toBe(false);
  });

  it("lets the last returned diver start next round", () => {
    const state = setupGame(["A", "B"]);

    state.players[1].diver.returned = true;
    state.lastReturnPlayerIndex = 1;
    state.lastTurn = true;

    const result = startNextRound(
      endRound(state),
    );

    expect(result.currentPlayerIndex).toBe(1);
    expect(result.firstPlayerIndex).toBe(1);
  });

  it("finishes the game after the third round", () => {
    const state = setupGame(["A", "B"]);

    state.round = 3;
    state.lastTurn = true;

    const result = endRound(state);

    expect(result.phase).toBe("finished");

    expect(() =>
      startNextRound(result),
    ).toThrow();
  });
});
