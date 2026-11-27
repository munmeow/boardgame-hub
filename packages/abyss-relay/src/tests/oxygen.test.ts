
import { describe, it, expect } from "vitest";
import { setupGame } from "../engine/setup.js";
import {
  calculateOxygenCost,
  consumeOxygen,
} from "../engine/oxygen.js";

describe("Deep Sea Adventure - Oxygen", () => {
  it("consumes no oxygen when carrying no treasure", () => {
    expect(calculateOxygenCost(0)).toBe(0);
  });

  it("consumes one oxygen per carried bundle", () => {
    expect(calculateOxygenCost(1)).toBe(1);
    expect(calculateOxygenCost(3)).toBe(3);
  });

  it("rejects invalid cargo counts", () => {
    expect(() => calculateOxygenCost(-1)).toThrow();
    expect(() => calculateOxygenCost(1.5)).toThrow();
  });

  it("reduces oxygen at the beginning of the current player's turn", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].cargo = [
      {
        id: "bundle-1",
        treasures: [
          { id: "treasure-1", level: 1, value: 1 },
        ],
      },
      {
        id: "bundle-2",
        treasures: [
          { id: "treasure-2", level: 1, value: 2 },
        ],
      },
    ];

    const updatedState = consumeOxygen(
      state,
      state.players[0].id,
    );

    expect(updatedState.oxygen).toBe(23);
  });

  it("counts a stack as one oxygen unit", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].cargo = [
      {
        id: "bundle-1",
        treasures: [
          { id: "treasure-1", level: 1, value: 1 },
          { id: "treasure-2", level: 1, value: 2 },
          { id: "treasure-3", level: 1, value: 3 },
        ],
      },
    ];

    const updatedState = consumeOxygen(
      state,
      state.players[0].id,
    );

    expect(updatedState.oxygen).toBe(24);
  });

  it("marks the current turn as the final turn when oxygen reaches zero", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.oxygen = 1;
    state.players[0].cargo = [
      {
        id: "bundle-1",
        treasures: [
          { id: "treasure-1", level: 1, value: 1 },
        ],
      },
    ];

    const updatedState = consumeOxygen(
      state,
      state.players[0].id,
    );

    expect(updatedState.oxygen).toBe(0);
    expect(updatedState.lastTurn).toBe(true);
  });

  it("allows oxygen to become negative", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.oxygen = 1;
    state.players[0].cargo = [
      {
        id: "bundle-1",
        treasures: [
          { id: "treasure-1", level: 1, value: 1 },
        ],
      },
      {
        id: "bundle-2",
        treasures: [
          { id: "treasure-2", level: 1, value: 2 },
        ],
      },
    ];

    const updatedState = consumeOxygen(
      state,
      state.players[0].id,
    );

    expect(updatedState.oxygen).toBe(-1);
    expect(updatedState.lastTurn).toBe(true);
  });

  it("does not allow a non-current player to consume oxygen", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    expect(() =>
      consumeOxygen(state, state.players[1].id),
    ).toThrow("Only the current player can consume oxygen.");
  });
});
