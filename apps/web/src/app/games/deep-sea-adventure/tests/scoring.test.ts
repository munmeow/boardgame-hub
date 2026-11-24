
import { describe, it, expect } from "vitest";

import { setupGame } from "../engine/setup";

import {
  calculateScore,
  getRankings,
  getWinners,
} from "../engine/scoring";

describe("Deep Sea Adventure - Scoring", () => {
  it("calculates collected treasure value", () => {
    const state = setupGame(["A", "B"]);

    state.players[0].collected = [
      { id: "t1", level: 1, value: 3 },
      { id: "t2", level: 3, value: 10 },
      { id: "t3", level: 4, value: 15 },
    ];

    expect(
      calculateScore(state.players[0]),
    ).toBe(28);
  });

  it("does not score unbanked cargo", () => {
    const state = setupGame(["A", "B"]);

    state.players[0].cargo = [
      state.track[0].bundle!,
    ];

    expect(
      calculateScore(state.players[0]),
    ).toBe(0);
  });

  it("ranks players by score", () => {
    const state = setupGame(["A", "B"]);

    state.players[0].collected = [
      { id: "t1", level: 1, value: 3 },
    ];

    state.players[1].collected = [
      { id: "t2", level: 4, value: 15 },
    ];

    expect(
      getRankings(state)[0].name,
    ).toBe("B");
  });

  it("applies the high-level treasure tie-break", () => {
    const state = setupGame(["A", "B"]);

    state.phase = "finished";

    state.players[0].collected = [
      { id: "t1", level: 2, value: 6 },
      { id: "t2", level: 2, value: 6 },
    ];

    state.players[1].collected = [
      { id: "t3", level: 4, value: 12 },
    ];

    expect(getWinners(state)[0].name).toBe("B");
  });

  it("allows multiple winners in an exact tie", () => {
    const state = setupGame(["A", "B"]);

    state.phase = "finished";

    expect(getWinners(state)).toHaveLength(2);
  });
});
