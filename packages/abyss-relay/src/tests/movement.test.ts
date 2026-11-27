
import { describe, it, expect } from "vitest";
import { setupGame } from "../engine/setup.js";
import {
  calculateMovement,
  moveDiver,
} from "../engine/movement.js";

describe("Deep Sea Adventure - Movement", () => {
  it("subtracts carried treasure from dice total", () => {
    expect(calculateMovement(5, 2)).toBe(3);
  });

  it("does not allow negative movement", () => {
    expect(calculateMovement(2, 3)).toBe(0);
  });

  it("moves outward correctly", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    const updatedState = moveDiver(
      state,
      state.players[0],
      3
    );

    expect(updatedState.players[0].diver.position).toBe(3);
    expect(updatedState.players[0].diver.returned).toBe(false);
  });

  it("stops at the final track tile", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 30;

    const updatedState = moveDiver(
      state,
      state.players[0],
      10
    );

    expect(updatedState.players[0].diver.position).toBe(32);
  });

  it("returns to the submarine", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 2;
    state.players[0].diver.direction = "inward";

    const updatedState = moveDiver(
      state,
      state.players[0],
      2
    );

    expect(updatedState.players[0].diver.position).toBe(0);
    expect(updatedState.players[0].diver.returned).toBe(true);
  });

  it("jumps over another diver without consuming an extra step", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[1].diver.position = 2;

    const updatedState = moveDiver(
      state,
      state.players[0],
      2
    );

    expect(updatedState.players[0].diver.position).toBe(3);
  });
});
