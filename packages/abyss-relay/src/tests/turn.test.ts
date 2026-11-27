
import { describe, it, expect } from "vitest";

import { setupGame } from "../engine/setup.js";

import {
  startTurn,
  declareDirection,
  swim,
  takeTreasure,
  skipTreasure,
} from "../engine/turn.js";

describe("Deep Sea Adventure - Turn", () => {
  it("moves from breathe to declare", () => {
    const state = setupGame(["A", "B"]);

    const result = startTurn(state);

    expect(result.turnStage).toBe("declare");
    expect(result.oxygen).toBe(25);
  });

  it("does not consume oxygen twice in one turn", () => {
    const state = startTurn(
      setupGame(["A", "B"]),
    );

    expect(() => startTurn(state)).toThrow();
  });

  it("allows a diver to turn back", () => {
    const state = setupGame(["A", "B"]);

    state.players[0].diver.position = 5;

    const result = declareDirection(
      startTurn(state),
      true,
    );

    expect(
      result.players[0].diver.direction,
    ).toBe("inward");

    expect(
      result.players[0].diver.hasTurned,
    ).toBe(true);
  });

  it("prevents a second direction change", () => {
    const state = setupGame(["A", "B"]);

    state.players[0].diver = {
      position: 5,
      direction: "inward",
      hasTurned: true,
      returned: false,
    };

    expect(() =>
      declareDirection(startTurn(state), true),
    ).toThrow();
  });

  it("rolls dice and moves the diver", () => {
    const state = startTurn(
      setupGame(["A", "B"]),
    );

    const result = swim(state, {
      first: 2,
      second: 2,
      total: 4,
    });

    expect(
      result.players[0].diver.position,
    ).toBe(4);

    expect(result.turnStage).toBe("treasure");
  });

  it("rejects invalid dice", () => {
    const state = startTurn(
      setupGame(["A", "B"]),
    );

    expect(() =>
      swim(state, {
        first: 6,
        second: 1,
        total: 7,
      }),
    ).toThrow();
  });

  it("prevents treasure actions before swimming", () => {
    const state = startTurn(
      setupGame(["A", "B"]),
    );

    expect(() => takeTreasure(state)).toThrow();
  });

  it("picks up treasure and advances to the next player", () => {
    const state = swim(
      startTurn(setupGame(["A", "B"])),
      { first: 1, second: 1, total: 2 },
    );

    const result = takeTreasure(state);

    expect(result.players[0].cargo).toHaveLength(1);
    expect(result.currentPlayerIndex).toBe(1);
    expect(result.turnStage).toBe("breathe");
  });

  it("skips treasure and advances to the next player", () => {
    const state = swim(
      startTurn(setupGame(["A", "B"])),
      { first: 1, second: 1, total: 2 },
    );

    const result = skipTreasure(state);

    expect(result.players[0].cargo).toHaveLength(0);
    expect(result.currentPlayerIndex).toBe(1);
  });

  it("allows the final turn to finish after oxygen reaches zero", () => {
    const state = setupGame(["A", "B"]);

    state.oxygen = 1;

    state.players[0].diver.position = 5;

    state.players[0].cargo = [
      state.track[0].bundle!,
    ];

    state.track[0] = {
      ...state.track[0],
      type: "blank",
      bundle: null,
    };

    const started = startTurn(state);

    expect(started.oxygen).toBe(0);
    expect(started.lastTurn).toBe(true);
    expect(started.phase).toBe("playing");

    const moved = swim(started, {
      first: 2,
      second: 2,
      total: 4,
    });

    expect(
      moved.players[0].diver.position,
    ).toBe(8);

    const result = skipTreasure(moved);

    expect(result.phase).toBe("round-ended");
    expect(result.currentPlayerIndex).toBe(0);
  });

  it("saves a diver returning on the final turn", () => {
    const state = setupGame(["A", "B"]);

    state.oxygen = 1;

    state.players[0].diver.position = 2;

    const bundle = state.track[0].bundle!;

    state.players[0].cargo = [bundle];

    state.track[0] = {
      ...state.track[0],
      type: "blank",
      bundle: null,
    };

    const started = startTurn(state);

    const declared = declareDirection(
      started,
      true,
    );

    const result = swim(declared, {
      first: 2,
      second: 1,
      total: 3,
    });

    expect(result.phase).toBe("round-ended");

    expect(result.players[0].collected).toEqual(
      bundle.treasures,
    );
  });

  it("skips players who have already returned", () => {
    const state = setupGame(["A", "B", "C"]);

    state.players[1].diver.returned = true;

    const moved = swim(
      startTurn(state),
      { first: 1, second: 1, total: 2 },
    );

    const result = skipTreasure(moved);

    expect(result.currentPlayerIndex).toBe(2);
  });
});
